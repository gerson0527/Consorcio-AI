import { Prisma } from "@prisma/client";

import { leerDatos } from "@/lib/campos";
import { claveConfigurada, pedirJson } from "@/lib/claude";
import { analizarEntorno } from "@/lib/env-schema";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/modules/auditoria";
import { calibrar } from "@/modules/aprendizaje/calibrar";
import {
  buscarEnMemoria,
  embeddingLocal,
  UMBRAL_EVIDENCIA,
  vectorSql,
} from "@/modules/conocimiento";
import {
  analizarConFragmentos,
  esquemaAnalisis,
  validarCitas,
  type Analisis,
} from "@/modules/evaluacion/analizar";
import {
  PROMPT_EVALUACION,
  VERSION_PROMPT,
} from "@/modules/evaluacion/prompts/evaluacion";
import { ordenarRanking } from "@/modules/evaluacion/ranking";
import { esquemaPerfil, type Perfil } from "@/modules/ingesta/perfil";
import { evaluarReglas, type Operador } from "@/modules/reglas";

type Fragmento = {
  id: string;
  seccion: string | null;
  pagina: number | null;
  texto: string;
};

export async function evaluarCaso(casoId: string, userId: string, ip?: string | null) {
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      cliente: { include: { consentimientos: true } },
      documentos: true,
    },
  });
  if (!caso) throw new Error("El caso no existe");
  if (caso.cliente.consentimientos.length === 0) {
    throw new Error("Sin consentimiento no se evalúa el caso");
  }
  const perfil = esquemaPerfil.parse(leerDatos<Perfil>(caso.perfil) ?? {});
  const faltantesDocumento = documentosFaltantes(
    caso.documentos.map((documento) => documento.tipo),
  );
  const entidades = await prisma.entidad.findMany({
    where: { activa: true },
    include: {
      politicas: { where: { vigente: true }, take: 1 },
      reglas: { where: { estado: "ACTIVA" } },
      calibraciones: { orderBy: { calculadaEn: "desc" }, take: 1 },
    },
  });

  const borradores = [];
  for (const entidad of entidades) {
    const politica = entidad.politicas[0];
    if (!politica) continue;
    const reglas = entidad.reglas.filter(
      (regla) => regla.tipoCredito === null || regla.tipoCredito === caso.tipoCredito,
    );
    const motor = evaluarReglas(
      perfil as unknown as Record<string, unknown>,
      reglas.map((regla) => ({
        id: regla.id,
        campo: regla.campo,
        operador: regla.operador as Operador,
        valor: regla.valor,
        mensaje: regla.mensaje,
      })),
    );
    const fragmentos = await buscarPolitica(
      entidad.id,
      preguntaDe(perfil, caso.tipoCredito),
    );
    const analisis = await analizar(
      entidad.id,
      fragmentos,
      motor.reglasDetalle,
      faltantesDocumento,
    );
    const muestras = entidad.calibraciones[0]?.muestras ?? 0;
    const minimo = analizarEntorno(process.env).CALIBRACION_MIN_MUESTRAS;
    const probabilidadBase = entidad.calibraciones[0]?.aprobacionReal ?? null;
    borradores.push({
      entidadId: entidad.id,
      politicaId: politica.id,
      cumpleReglas: motor.cumpleReglas,
      reglasDetalle: motor.reglasDetalle,
      veredicto: analisis.veredicto,
      explicacion: analisis.explicacion,
      citas: analisis.citas.map((cita) => {
        const fragmento = fragmentos.find((item) => item.id === cita.fragmentoId);
        return { ...cita, texto: fragmento?.texto.slice(0, 400) ?? "" };
      }),
      probabilidad: probabilidadBase,
      tieneCitas: analisis.citas.length > 0,
      faltanDatos: motor.faltantes.length > 0 || faltantesDocumento.length > 0,
      muestrasCalibracion: muestras,
      minimoMuestras: minimo,
      modeloIA: claveConfigurada() ? "coarena" : "local-sin-api",
    });
  }

  const ordenados = ordenarRanking(borradores);
  await prisma.evaluacion.deleteMany({ where: { casoId, resultado: { is: null } } });
  await prisma.evaluacion.createMany({
    data: ordenados.map((item) => ({
      casoId,
      entidadId: item.entidadId,
      politicaId: item.politicaId,
      cumpleReglas: item.cumpleReglas,
      reglasDetalle: item.reglasDetalle as Prisma.InputJsonValue,
      probabilidad: item.probabilidad,
      confianza: item.confianza,
      ranking: item.ranking,
      explicacion: item.explicacion,
      citas: item.citas as Prisma.InputJsonValue,
      modeloIA: item.modeloIA,
      versionPrompt: VERSION_PROMPT,
      veredicto: item.veredicto,
    })),
  });
  await registrarAuditoria({
    userId,
    accion: "evaluar_caso",
    objetoTipo: "Caso",
    objetoId: casoId,
    ip,
    detalle: {
      versionPrompt: VERSION_PROMPT,
      entidades: ordenados.map((item) => ({
        entidadId: item.entidadId,
        veredicto: item.veredicto,
        citas: item.citas.map((cita) => cita.fragmentoId),
        modelo: item.modeloIA,
      })),
    },
  });
}

async function analizar(
  entidadId: string,
  fragmentos: Fragmento[],
  detalles: Array<{ resultado: string; campo: string; mensaje: string }>,
  faltantesDocumento: string[],
): Promise<Analisis> {
  const local = analizarConFragmentos({
    entidadId,
    fragmentos,
    detalles,
    faltantesDocumento,
  });
  if (!claveConfigurada() || fragmentos.length === 0) return local;
  let error = "";
  for (let intento = 0; intento < 2; intento += 1) {
    try {
      const respuesta = await pedirJson({
        sistema: PROMPT_EVALUACION,
        contenido: `${error}\nFragmentos: ${JSON.stringify(fragmentos)}\nReglas: ${JSON.stringify(detalles)}\nFaltantes: ${faltantesDocumento.join(", ")}`,
        esquema: esquemaAnalisis,
      });
      if (
        respuesta.datos.veredicto === "INSUFICIENTE" ||
        validarCitas(respuesta.datos.citas, fragmentos)
      ) {
        return respuesta.datos;
      }
      error = "Las citas deben usar fragmentoId entregados.";
    } catch (causa) {
      error = causa instanceof Error ? causa.message : "JSON inválido";
    }
  }
  return {
    ...local,
    veredicto: "INSUFICIENTE",
    explicacion:
      "La respuesta del modelo no citó fragmentos válidos. Queda para revisión humana.",
    citas: [],
  };
}

async function buscarPolitica(entidadId: string, pregunta: string) {
  const vector = embeddingLocal(pregunta);
  try {
    const literal = vectorSql(vector);
    const filas = await prisma.$queryRaw<Fragmento[]>`
      SELECT f.id, f.seccion, f.pagina, f.texto
      FROM "Fragmento" f
      JOIN "Politica" p ON p.id = f."politicaId"
      WHERE p."entidadId" = ${entidadId}
        AND p.vigente = true
        AND f.embedding IS NOT NULL
        AND 1 - (f.embedding <=> ${literal}::vector) >= ${UMBRAL_EVIDENCIA}
      ORDER BY f.embedding <=> ${literal}::vector
      LIMIT 4
    `;
    if (filas.length > 0) return filas;
  } catch {
    // Sin la extensión vector se usa la búsqueda en memoria.
  }
  const fragmentos = await prisma.fragmento.findMany({
    where: { politica: { entidadId, vigente: true } },
    select: { id: true, seccion: true, pagina: true, texto: true },
  });
  return buscarEnMemoria(pregunta, fragmentos).map((fragmento) => ({
    id: fragmento.id,
    seccion: fragmento.seccion,
    pagina: fragmento.pagina,
    texto: fragmento.texto,
  }));
}

function preguntaDe(perfil: Perfil, tipoCredito: string) {
  return `Requisitos de ${tipoCredito}. Edad ${perfil.edad ?? "desconocida"}. Ingreso mensual ${perfil.ingresoMensual ?? "desconocido"}. Antigüedad laboral ${perfil.antiguedadLaboralMeses ?? "desconocida"} meses.`;
}

function documentosFaltantes(tipos: string[]) {
  return ["cedula", "desprendible", "certificado_laboral"].filter(
    (tipo) => !tipos.includes(tipo),
  );
}

export { calibrar };

import { prisma } from "@/lib/prisma";
import { leerDatos } from "@/lib/campos";
import { registrarAuditoria } from "@/modules/auditoria";
import { calibrar } from "@/modules/aprendizaje/calibrar";
import { sugerirUmbral } from "@/modules/aprendizaje/patrones";
import { analizarEntorno } from "@/lib/env-schema";
import type { Perfil } from "@/modules/ingesta/perfil";

export async function recalibrarEntidad(entidadId: string) {
  const evaluaciones = await prisma.evaluacion.findMany({
    where: { entidadId, veredicto: { not: "INSUFICIENTE" }, resultado: { isNot: null } },
    include: { resultado: true },
  });
  const entorno = analizarEntorno(process.env);
  const calculo = calibrar(
    evaluaciones.map((evaluacion) => ({
      predicha:
        evaluacion.probabilidad ??
        (evaluacion.veredicto === "FAVORABLE"
          ? 0.7
          : evaluacion.veredicto === "CONDICIONADO"
            ? 0.45
            : 0.2),
      aprobado: evaluacion.resultado?.estado === "APROBADO",
    })),
    entorno.CALIBRACION_MIN_MUESTRAS,
  );
  await prisma.calibracion.create({
    data: {
      entidadId,
      muestras: calculo.muestras,
      aprobacionPredicha: calculo.aprobacionPredicha,
      aprobacionReal: calculo.aprobacionReal,
      parametros: calculo.parametros,
    },
  });
  return calculo;
}

export async function detectarPatrones() {
  const entorno = analizarEntorno(process.env);
  const entidades = await prisma.entidad.findMany({ select: { id: true, nombre: true } });
  const creadas: string[] = [];
  for (const entidad of entidades) {
    const evaluaciones = await prisma.evaluacion.findMany({
      where: { entidadId: entidad.id, resultado: { isNot: null } },
      include: { resultado: true, caso: true },
    });
    for (const campo of ["antiguedadLaboralMeses", "ingresoMensual"] as const) {
      const patron = sugerirUmbral(
        campo,
        evaluaciones.map((evaluacion) => {
          const perfil = leerDatos<Partial<Perfil>>(evaluacion.caso.perfil) ?? {};
          return {
            id: evaluacion.casoId,
            valor: typeof perfil[campo] === "number" ? perfil[campo] : null,
            rechazado: evaluacion.resultado?.estado === "RECHAZADO",
            fecha:
              evaluacion.resultado?.registradoEn.toISOString() ??
              evaluacion.creadaEn.toISOString(),
          };
        }),
        entorno.REGLA_SUGERIDA_MIN_SOPORTE,
        entorno.REGLA_SUGERIDA_MIN_PRECISION,
      );
      if (!patron) continue;
      const existente = await prisma.regla.findFirst({
        where: {
          entidadId: entidad.id,
          campo,
          operador: patron.operador,
          estado: { in: ["PENDIENTE", "ACTIVA"] },
        },
      });
      if (existente) continue;
      const regla = await prisma.regla.create({
        data: {
          entidadId: entidad.id,
          campo,
          operador: patron.operador,
          valor: patron.valor,
          mensaje: `En el historial de ${entidad.nombre}, los casos por debajo de ${patron.valor} concentran los rechazos. Esta regla queda pendiente de aprobación humana.`,
          origen: "SUGERIDA_IA",
          estado: "PENDIENTE",
          evidencia: {
            soporte: patron.soporte,
            precision: patron.precision,
            casos: patron.casos,
            desde: patron.desde,
            hasta: patron.hasta,
          },
        },
      });
      creadas.push(regla.id);
    }
  }
  if (creadas.length > 0) {
    await registrarAuditoria({
      accion: "sugerir_reglas",
      objetoTipo: "Regla",
      detalle: { reglas: creadas, estado: "PENDIENTE" },
    });
  }
  return creadas;
}

export async function decidirRegla(
  reglaId: string,
  decision: "ACTIVA" | "RECHAZADA",
  userId: string,
  ip?: string | null,
) {
  const regla = await prisma.regla.update({
    where: { id: reglaId },
    data: { estado: decision, decididaPorId: userId, decididaEn: new Date() },
  });
  await registrarAuditoria({
    userId,
    ip,
    accion: decision === "ACTIVA" ? "aprobar_regla" : "descartar_regla",
    objetoTipo: "Regla",
    objetoId: regla.id,
    detalle: { estado: decision, campo: regla.campo, operador: regla.operador },
  });
  return regla;
}

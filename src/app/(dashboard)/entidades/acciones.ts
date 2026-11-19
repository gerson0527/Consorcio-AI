"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { guardarArchivo } from "@/lib/almacen";
import { prisma } from "@/lib/prisma";
import { exigirAccion } from "@/lib/sesion";
import { ipSolicitud } from "@/lib/solicitud";
import { registrarAuditoria } from "@/modules/auditoria";
import { guardarPolitica, leerPoliticaMarkdown } from "@/modules/conocimiento";
import { claveAleatoria } from "@/modules/ingesta";
import { generarReglasDesdePolitica } from "@/modules/reglas/generar-politica";
import { esquemaRegla } from "@/modules/reglas";

export async function guardarEntidad(formData: FormData) {
  const usuario = await exigirAccion("editar_entidades");
  const datos = z
    .object({
      id: z.string().optional(),
      nombre: z.string().trim().min(3).max(120),
      tipo: z.enum(["BANCO", "FINANCIERA", "COOPERATIVA"]),
      activa: z.enum(["true", "false"]).optional(),
    })
    .safeParse({
      id: formData.get("id") || undefined,
      nombre: formData.get("nombre"),
      tipo: formData.get("tipo"),
      activa: formData.get("activa") ? "true" : "false",
    });
  if (!datos.success) redirect("/entidades?error=datos");
  const entidad = datos.data.id
    ? await prisma.entidad.update({
        where: { id: datos.data.id },
        data: {
          nombre: datos.data.nombre,
          tipo: datos.data.tipo,
          activa: datos.data.activa === "true",
        },
      })
    : await prisma.entidad.create({
        data: { nombre: `${datos.data.nombre} (ejemplo)`, tipo: datos.data.tipo },
      });
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: datos.data.id ? "editar_entidad" : "crear_entidad",
    objetoTipo: "Entidad",
    objetoId: entidad.id,
    detalle: { tipo: entidad.tipo },
  });
  redirect(`/entidades/${entidad.id}?aviso=guardado`);
}

export async function subirPolitica(formData: FormData) {
  const usuario = await exigirAccion("subir_politica");
  const entidadId = z.string().parse(formData.get("entidadId"));
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) redirect(`/entidades/${entidadId}?error=archivo`);
  const bytes = Buffer.from(await archivo.arrayBuffer());
  const markdown = leerPoliticaMarkdown(archivo.name, bytes);
  if (!markdown.ok) redirect(`/entidades/${entidadId}?error=${markdown.error}`);
  const clave = claveAleatoria(`politicas/${entidadId}`);
  await guardarArchivo(clave, bytes, "text/markdown; charset=utf-8");
  const politica = await guardarPolitica({
    entidadId,
    texto: markdown.texto,
    archivoKey: clave,
    subidaPorId: usuario.id,
  });
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "subir_politica",
    objetoTipo: "Politica",
    objetoId: politica.id,
    detalle: { version: politica.version, fragmentos: politica.fragmentos.length },
  });
  const resultado = await generarYAuditarReglas(usuario.id, politica, markdown.texto);
  redirect(
    `/entidades/${entidadId}?aviso=politica&reglas=${resultado.estado}&cantidad=${resultado.ids.length}`,
  );
}

export async function crearReglasDesdePolitica(formData: FormData) {
  const usuario = await exigirAccion("subir_politica");
  const politicaId = z.string().min(1).max(64).safeParse(formData.get("politicaId"));
  if (!politicaId.success) redirect("/entidades?error=politica");
  const politica = await prisma.politica.findUnique({
    where: { id: politicaId.data },
    include: { fragmentos: { orderBy: { orden: "asc" } } },
  });
  if (!politica) redirect("/entidades?error=politica");
  if (politica.fragmentos.length === 0) {
    redirect(`/entidades/${politica.entidadId}?error=fragmentos`);
  }
  const markdown = politica.fragmentos
    .map(
      (fragmento) =>
        `${fragmento.seccion ? `## ${fragmento.seccion}\n` : ""}${fragmento.texto}`,
    )
    .join("\n\n");
  const resultado = await generarYAuditarReglas(usuario.id, politica, markdown);
  redirect(
    `/entidades/${politica.entidadId}?version=${politica.version}&aviso=politica&reglas=${resultado.estado}&cantidad=${resultado.ids.length}`,
  );
}

export async function retirarReglasActivas(formData: FormData) {
  const usuario = await exigirAccion("editar_reglas");
  const entidadId = z.string().min(1).max(64).parse(formData.get("entidadId"));
  const reglas = await prisma.$transaction(async (tx) => {
    const activas = await tx.regla.findMany({
      where: { entidadId, estado: "ACTIVA" },
      select: { id: true },
    });
    if (activas.length === 0) return [];
    await tx.regla.updateMany({
      where: { id: { in: activas.map((regla) => regla.id) }, estado: "ACTIVA" },
      data: {
        estado: "RECHAZADA",
        decididaPorId: usuario.id,
        decididaEn: new Date(),
      },
    });
    return activas.map((regla) => regla.id);
  });
  if (reglas.length > 0) {
    await registrarAuditoria({
      userId: usuario.id,
      ip: await ipSolicitud(),
      accion: "retirar_reglas_activas",
      objetoTipo: "Entidad",
      objetoId: entidadId,
      detalle: { reglas, cantidad: reglas.length, estado: "RECHAZADA" },
    });
  }
  redirect(`/entidades/${entidadId}?aviso=reglas_retiradas&cantidad=${reglas.length}`);
}

export async function crearRegla(formData: FormData) {
  const usuario = await exigirAccion("editar_reglas");
  const entidadId = z.string().parse(formData.get("entidadId"));
  const valorCrudo = formData.get("valor");
  let valor: unknown = valorCrudo;
  try {
    valor = JSON.parse(String(valorCrudo));
  } catch {
    valor = Number(valorCrudo);
    if (Number.isNaN(valor)) valor = valorCrudo;
  }
  const datos = esquemaRegla.safeParse({
    campo: formData.get("campo"),
    operador: formData.get("operador"),
    valor,
    mensaje: formData.get("mensaje"),
    tipoCredito: formData.get("tipoCredito") || null,
  });
  if (!datos.success) redirect(`/entidades/${entidadId}?error=regla`);
  const regla = await prisma.regla.create({
    data: {
      entidadId,
      campo: datos.data.campo,
      operador: datos.data.operador,
      valor: datos.data.valor,
      mensaje: datos.data.mensaje,
      tipoCredito: datos.data.tipoCredito,
      origen: "MANUAL",
      estado: "ACTIVA",
      decididaPorId: usuario.id,
      decididaEn: new Date(),
    },
  });
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "crear_regla",
    objetoTipo: "Regla",
    objetoId: regla.id,
    detalle: { campo: regla.campo, operador: regla.operador },
  });
  redirect(`/entidades/${entidadId}?aviso=regla`);
}

async function generarYAuditarReglas(
  userId: string,
  politica: { id: string; entidadId: string; version: number },
  markdown: string,
) {
  const resultado = await generarReglasDesdePolitica({
    entidadId: politica.entidadId,
    politicaId: politica.id,
    version: politica.version,
    markdown,
  });
  if (resultado.ids.length > 0) {
    await registrarAuditoria({
      userId,
      ip: await ipSolicitud(),
      accion: "sugerir_reglas_politica",
      objetoTipo: "Regla",
      objetoId: politica.id,
      detalle: { reglas: resultado.ids, estado: "PENDIENTE" },
    });
  }
  return resultado;
}

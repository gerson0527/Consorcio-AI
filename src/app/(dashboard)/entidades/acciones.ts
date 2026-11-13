"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { guardarArchivo } from "@/lib/almacen";
import { prisma } from "@/lib/prisma";
import { exigirAccion } from "@/lib/sesion";
import { ipSolicitud } from "@/lib/solicitud";
import { registrarAuditoria } from "@/modules/auditoria";
import { guardarPolitica, textoPlanoDePdf } from "@/modules/conocimiento";
import { claveAleatoria, validarArchivo } from "@/modules/ingesta";
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
        data: { nombre: datos.data.nombre, tipo: datos.data.tipo, activa: datos.data.activa === "true" },
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
  const validacion = validarArchivo(bytes, archivo.type || "text/plain");
  if (!validacion.ok) redirect(`/entidades/${entidadId}?error=archivo`);
  const texto = archivo.type === "application/pdf" ? textoPlanoDePdf(bytes) : bytes.toString("utf8");
  if (texto.trim().length < 20) redirect(`/entidades/${entidadId}?error=texto`);
  const clave = claveAleatoria(`politicas/${entidadId}`);
  await guardarArchivo(clave, bytes, archivo.type || "text/plain");
  const politica = await guardarPolitica({
    entidadId,
    texto,
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
  redirect(`/entidades/${entidadId}?aviso=politica`);
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

"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { cifrarDocumento, hashDocumentoProtegido } from "@/lib/campos";
import { filtroCasoPropio, filtroClienteAccesible } from "@/lib/acceso-clientes";
import { eliminarArchivo, guardarArchivo } from "@/lib/almacen";
import { limitar } from "@/lib/limite";
import { prisma } from "@/lib/prisma";
import { exigirAccion } from "@/lib/sesion";
import { ipSolicitud } from "@/lib/solicitud";
import { recalibrarEntidad, detectarPatrones } from "@/modules/aprendizaje";
import { registrarAuditoria } from "@/modules/auditoria";
import { evaluarCaso } from "@/modules/evaluacion";
import { claveAleatoria, validarArchivo } from "@/modules/ingesta";
import { encolarExtraccion, redisDisponible } from "@/jobs/cola";
import { MAXIMO_ARCHIVO_BYTES } from "@/modules/ingesta/limites";

const esquemaCliente = z.object({
  nombre: z.string().trim().min(3).max(120),
  documento: z.string().trim().min(5).max(20),
  finalidad: z.literal("on"),
  tipoCredito: z.enum(["LIBRANZA", "VEHICULO", "VIVIENDA", "CONSUMO"]),
});

export async function crearCliente(formData: FormData) {
  const usuario = await exigirAccion("editar_clientes");
  const datos = esquemaCliente.safeParse({
    nombre: formData.get("nombre"),
    documento: formData.get("documento"),
    finalidad: formData.get("finalidad"),
    tipoCredito: formData.get("tipoCredito"),
  });
  if (!datos.success) redirect("/clientes/nuevo?error=datos");
  const hash = hashDocumentoProtegido(datos.data.documento);
  const existente = await prisma.cliente.findUnique({ where: { documentoHash: hash } });
  if (existente && !existente.suprimidoEn) {
    const accesible = await prisma.cliente.findFirst({
      where: { id: existente.id, ...filtroClienteAccesible(usuario) },
      select: { id: true },
    });
    if (accesible) redirect(`/clientes/${existente.id}?aviso=existente`);
    redirect("/clientes/nuevo?error=datos");
  }
  const cliente = await prisma.cliente.create({
    data: {
      nombre: datos.data.nombre,
      documentoHash: hash,
      documentoCifrado: cifrarDocumento(datos.data.documento),
      consentimientos: {
        create: {
          finalidad: "Preanálisis crediticio ante entidades financieras",
          otorgadoEn: new Date(),
        },
      },
      casos: {
        create: { tipoCredito: datos.data.tipoCredito, analistaId: usuario.id },
      },
    },
  });
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "crear_cliente",
    objetoTipo: "Cliente",
    objetoId: cliente.id,
    detalle: { tipoCredito: datos.data.tipoCredito },
  });
  redirect(`/clientes/${cliente.id}`);
}

export async function editarCliente(formData: FormData) {
  const usuario = await exigirAccion("editar_clientes");
  const id = z.string().parse(formData.get("id"));
  const nombre = z.string().trim().min(3).max(120).safeParse(formData.get("nombre"));
  const tipo = z
    .enum(["LIBRANZA", "VEHICULO", "VIVIENDA", "CONSUMO"])
    .safeParse(formData.get("tipoCredito"));
  if (!nombre.success) redirect(`/clientes/${id}?error=datos`);
  const cliente = await prisma.cliente.findFirst({
    where: { id, ...filtroClienteAccesible(usuario) },
    include: {
      casos: {
        orderBy: { creadoEn: "desc" },
        take: 1,
        include: { evaluaciones: { include: { resultado: true } } },
      },
    },
  });
  if (!cliente || cliente.suprimidoEn) redirect("/clientes?error=permiso");
  const caso = cliente.casos[0];
  const cerrado = caso?.evaluaciones.some(
    (evaluacion) => evaluacion.resultado && evaluacion.resultado.estado !== "PENDIENTE",
  );
  if (cerrado) redirect(`/clientes/${id}?error=cerrado`);
  await prisma.cliente.update({ where: { id }, data: { nombre: nombre.data } });
  if (caso && tipo.success) {
    await prisma.caso.update({
      where: { id: caso.id },
      data: { tipoCredito: tipo.data },
    });
  }
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "editar_cliente",
    objetoTipo: "Cliente",
    objetoId: id,
    detalle: { nombre: nombre.data, tipoCredito: tipo.success ? tipo.data : undefined },
  });
  redirect(`/clientes/${id}?aviso=guardado`);
}

export async function subirDocumento(formData: FormData) {
  const usuario = await exigirAccion("editar_clientes");
  if (!limitar(`subida:${usuario.id}`, 20, 10 * 60 * 1000)) {
    redirect("/clientes?error=limite");
  }
  const casoId = z.string().parse(formData.get("casoId"));
  if (!redisDisponible()) {
    redirect(`/clientes/${casoId}?error=procesamiento_pausado`);
  }
  const tipo = z
    .enum(["cedula", "desprendible", "certificado_laboral", "extracto", "otro"])
    .parse(formData.get("tipo"));
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) redirect(`/clientes/${casoId}?error=archivo`);
  const bytes = Buffer.from(await archivo.arrayBuffer());
  const validacion = validarArchivo(bytes, archivo.type || "text/plain");
  if (!validacion.ok) {
    redirect(
      `/clientes/${casoId}?error=${bytes.length > MAXIMO_ARCHIVO_BYTES ? "archivo_tamano" : "archivo"}`,
    );
  }
  const caso = await prisma.caso.findFirst({
    where: { id: casoId, ...filtroCasoPropio(usuario) },
    include: { cliente: { include: { consentimientos: true } } },
  });
  if (!caso || caso.cliente.consentimientos.length === 0)
    redirect("/clientes?error=permiso");
  const clave = claveAleatoria(casoId);
  await guardarArchivo(clave, bytes, archivo.type || "text/plain");
  const documento = await prisma.documento.create({
    data: { casoId, tipo, archivoKey: clave, estado: "PENDIENTE" },
  });
  await encolarExtraccion(documento.id);
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "subir_documento",
    objetoTipo: "Documento",
    objetoId: documento.id,
    detalle: { tipo, casoId },
  });
  redirect(`/clientes/${caso.clienteId}?aviso=documento`);
}

export async function evaluar(formData: FormData) {
  const usuario = await exigirAccion("evaluar");
  const casoId = z.string().parse(formData.get("casoId"));
  const caso = await prisma.caso.findFirst({
    where: { id: casoId, ...filtroCasoPropio(usuario) },
  });
  if (!caso) redirect("/clientes?error=permiso");
  await evaluarCaso(casoId, usuario.id, await ipSolicitud());
  redirect(`/clientes/${caso.clienteId}?aviso=evaluado`);
}

export async function registrarResultado(formData: FormData) {
  const usuario = await exigirAccion("registrar_resultado");
  const evaluacionId = z.string().parse(formData.get("evaluacionId"));
  const estado = z.enum(["APROBADO", "RECHAZADO"]).parse(formData.get("estado"));
  const motivo = z.string().trim().min(3).max(300).parse(formData.get("motivo"));
  const evaluacion = await prisma.evaluacion.findFirst({
    where: {
      id: evaluacionId,
      ...(usuario.rol === "ANALISTA" ? { caso: { is: filtroCasoPropio(usuario) } } : {}),
    },
  });
  if (!evaluacion) redirect("/clientes?error=permiso");
  await prisma.resultado.upsert({
    where: { evaluacionId },
    update: { estado, motivo, registradoPorId: usuario.id, registradoEn: new Date() },
    create: { evaluacionId, estado, motivo, registradoPorId: usuario.id },
  });
  await recalibrarEntidad(evaluacion.entidadId);
  await detectarPatrones();
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "registrar_resultado",
    objetoTipo: "Evaluacion",
    objetoId: evaluacionId,
    detalle: { estado },
  });
  const caso = await prisma.caso.findUnique({ where: { id: evaluacion.casoId } });
  redirect(`/clientes/${caso?.clienteId}?aviso=resultado`);
}

export async function suprimirCliente(formData: FormData) {
  const usuario = await exigirAccion("suprimir_datos");
  const id = z.string().parse(formData.get("id"));
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { casos: { include: { documentos: true } } },
  });
  if (!cliente) redirect("/clientes");
  for (const caso of cliente.casos) {
    for (const documento of caso.documentos) {
      await eliminarArchivo(documento.archivoKey);
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.caso.updateMany({
      where: { clienteId: id },
      data: { perfil: Prisma.JsonNull },
    });
    await tx.documento.deleteMany({ where: { caso: { clienteId: id } } });
    await tx.cliente.update({
      where: { id },
      data: {
        nombre: "Persona suprimida",
        documentoHash: `suprimido-${randomUUID()}`,
        documentoCifrado: cifrarDocumento("suprimido"),
        suprimidoEn: new Date(),
      },
    });
  });
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "suprimir_cliente",
    objetoTipo: "Cliente",
    objetoId: id,
    detalle: {
      documentos: cliente.casos.reduce(
        (total, caso) => total + caso.documentos.length,
        0,
      ),
    },
  });
  redirect("/clientes?aviso=suprimido");
}

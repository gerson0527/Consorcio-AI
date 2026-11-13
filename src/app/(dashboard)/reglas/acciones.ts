"use server";

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { exigirAccion } from "@/lib/sesion";
import { ipSolicitud } from "@/lib/solicitud";
import { decidirRegla } from "@/modules/aprendizaje";
import { registrarAuditoria } from "@/modules/auditoria";
import { recalibrarEntidad } from "@/modules/aprendizaje";
import { parsearCsvResultados } from "@/modules/reportes";

export async function aprobarRegla(formData: FormData) {
  const usuario = await exigirAccion("aprobar_reglas");
  const id = String(formData.get("id"));
  const decision = formData.get("decision") === "RECHAZADA" ? "RECHAZADA" : "ACTIVA";
  await decidirRegla(id, decision, usuario.id, await ipSolicitud());
  redirect("/reglas?aviso=1");
}

export async function previsualizarCsv(formData: FormData) {
  const usuario = await exigirAccion("importar_historico");
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) redirect("/reportes?error=archivo");
  const texto = await archivo.text();
  const resultado = parsearCsvResultados(texto);
  const destino = path.join(process.cwd(), ".data", "importaciones");
  await mkdir(destino, { recursive: true });
  await writeFile(
    path.join(destino, `${usuario.id}.json`),
    JSON.stringify(resultado),
    "utf8",
  );
  redirect("/reportes/importacion");
}

export async function confirmarCsv() {
  const usuario = await exigirAccion("importar_historico");
  const ruta = path.join(process.cwd(), ".data", "importaciones", `${usuario.id}.json`);
  const guardado = JSON.parse(await readFile(ruta, "utf8")) as ReturnType<typeof parsearCsvResultados>;
  let aplicadas = 0;
  for (const fila of guardado.validas) {
    const cliente = await prisma.cliente.findUnique({ where: { documentoHash: fila.documentoHash } });
    const entidad = await prisma.entidad.findFirst({
      where: { nombre: { equals: fila.entidad, mode: "insensitive" } },
    });
    if (!cliente || !entidad) continue;
    const evaluacion = await prisma.evaluacion.findFirst({
      where: { caso: { clienteId: cliente.id }, entidadId: entidad.id },
      orderBy: { creadaEn: "desc" },
    });
    if (!evaluacion) continue;
    await prisma.resultado.upsert({
      where: { evaluacionId: evaluacion.id },
      update: { estado: fila.estado, motivo: fila.motivo, registradoPorId: usuario.id },
      create: {
        evaluacionId: evaluacion.id,
        estado: fila.estado,
        motivo: fila.motivo,
        registradoPorId: usuario.id,
      },
    });
    await recalibrarEntidad(entidad.id);
    aplicadas += 1;
  }
  await registrarAuditoria({
    userId: usuario.id,
    ip: await ipSolicitud(),
    accion: "importar_resultados",
    objetoTipo: "Resultado",
    detalle: { aplicadas, rechazadas: guardado.errores.length },
  });
  redirect(`/reportes?aviso=importadas-${aplicadas}`);
}

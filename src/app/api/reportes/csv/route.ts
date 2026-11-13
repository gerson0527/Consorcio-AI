import { NextResponse } from "next/server";

import { puede } from "@/lib/autorizacion";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aCsv, resumirReporte, type FilaReporte } from "@/modules/reportes";

export async function GET(request: Request) {
  const sesion = await auth();
  if (!sesion?.user || !puede(sesion.user.rol, "ver_reportes")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const url = new URL(request.url);
  const desde = new Date(url.searchParams.get("desde") ?? "2020-01-01");
  const hasta = new Date(url.searchParams.get("hasta") ?? "2100-01-01");
  const evaluaciones = await prisma.evaluacion.findMany({
    where: { creadaEn: { gte: desde, lte: hasta } },
    include: { entidad: true, resultado: true, caso: true },
  });
  const filas: FilaReporte[] = evaluaciones.map((evaluacion) => ({
    casoId: evaluacion.casoId,
    entidad: evaluacion.entidad.nombre,
    veredicto: evaluacion.veredicto,
    resultado: evaluacion.resultado && evaluacion.resultado.estado !== "PENDIENTE" ? evaluacion.resultado.estado : null,
    motivo: evaluacion.resultado?.motivo ?? null,
    creadoEn: evaluacion.caso.creadoEn,
    resultadoEn: evaluacion.resultado?.registradoEn ?? null,
  }));
  const resumen = resumirReporte(filas);
  const csv = aCsv([
    ["indicador", "valor"],
    ["casos", String(resumen.casos)],
    ["evaluaciones", String(resumen.evaluaciones)],
    ["coincidencia", resumen.coincidencia === null ? "" : String(resumen.coincidencia)],
    ...resumen.tasaPorEntidad.map((entidad) => [entidad.entidad, String(entidad.tasaAprobacion)]),
    ...resumen.motivos.map((motivo) => [motivo.motivo, String(motivo.cantidad)]),
  ]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=reporte.csv",
    },
  });
}

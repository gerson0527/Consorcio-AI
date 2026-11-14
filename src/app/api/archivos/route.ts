import { NextResponse } from "next/server";

import { firmaValida, leerArchivo } from "@/lib/almacen";
import { prisma } from "@/lib/prisma";
import { usuarioActual } from "@/lib/sesion";

export async function GET(request: Request) {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const url = new URL(request.url);
  const clave = url.searchParams.get("clave") ?? "";
  const expira = url.searchParams.get("expira") ?? "";
  const firma = url.searchParams.get("firma") ?? "";
  if (!clave || !firmaValida(clave, expira, firma)) {
    return NextResponse.json({ error: "El enlace venció" }, { status: 403 });
  }
  const documento = await prisma.documento.findFirst({
    where: {
      archivoKey: clave,
      ...(usuario.rol === "ANALISTA" ? { caso: { is: { analistaId: usuario.id } } } : {}),
    },
    select: { id: true },
  });
  if (!documento)
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  const bytes = await leerArchivo(clave);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "attachment",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

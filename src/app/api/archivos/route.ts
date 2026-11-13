import { NextResponse } from "next/server";

import { firmaValida, leerArchivo } from "@/lib/almacen";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await auth();
  if (!sesion?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const url = new URL(request.url);
  const clave = url.searchParams.get("clave") ?? "";
  const expira = url.searchParams.get("expira") ?? "";
  const firma = url.searchParams.get("firma") ?? "";
  if (!clave || !firmaValida(clave, expira, firma)) {
    return NextResponse.json({ error: "El enlace venció" }, { status: 403 });
  }
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

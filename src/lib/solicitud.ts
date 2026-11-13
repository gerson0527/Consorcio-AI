import { headers } from "next/headers";

export async function ipSolicitud() {
  const lista = await headers();
  return lista.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

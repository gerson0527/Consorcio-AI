import { redirect } from "next/navigation";

import { puede, type Accion } from "@/lib/autorizacion";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function exigirAccion(accion: Accion) {
  const sesion = await auth();
  if (!sesion?.user?.id) redirect("/login");
  const usuario = await prisma.user.findUnique({ where: { id: sesion.user.id } });
  if (!usuario?.activo || !puede(usuario.rol, accion)) {
    redirect("/clientes?error=permiso");
  }
  return usuario;
}

export async function sesionActual() {
  const sesion = await auth();
  if (!sesion?.user?.id) redirect("/login");
  const usuario = await prisma.user.findUnique({ where: { id: sesion.user.id } });
  if (!usuario?.activo) redirect("/login");
  return usuario;
}

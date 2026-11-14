import { redirect } from "next/navigation";

import { puede, type Accion } from "@/lib/autorizacion";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function usuarioActual() {
  const sesion = await auth();
  if (!sesion?.user?.id) return null;
  const usuario = await prisma.user.findUnique({
    where: { id: sesion.user.id },
    select: { id: true, rol: true, activo: true },
  });
  return usuario?.activo ? usuario : null;
}

export async function exigirAccion(accion: Accion) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (!puede(usuario.rol, accion)) {
    redirect("/clientes?error=permiso");
  }
  return usuario;
}

export async function sesionActual() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

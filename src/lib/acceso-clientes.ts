import type { Prisma } from "@prisma/client";

import type { Rol } from "@/lib/autorizacion";

type Usuario = { id: string; rol: Rol };

export function filtroCasoPropio(usuario: Usuario): Prisma.CasoWhereInput {
  return usuario.rol === "ANALISTA" ? { analistaId: usuario.id } : {};
}

export function filtroClienteAccesible(usuario: Usuario): Prisma.ClienteWhereInput {
  return usuario.rol === "ANALISTA" ? { casos: { some: filtroCasoPropio(usuario) } } : {};
}

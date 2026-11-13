import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const sensible = /documento|cedula|password|clave|authorization|numero|token/i;

export function sanearDetalle(valor: unknown): Prisma.InputJsonValue {
  if (Array.isArray(valor)) return valor.map((item) => sanearDetalle(item));
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, item]) => [
        clave,
        sensible.test(clave) ? "[omitido]" : sanearDetalle(item),
      ]),
    );
  }
  return valor as Prisma.InputJsonValue;
}

export async function registrarAuditoria(entrada: {
  userId?: string | null;
  accion: string;
  objetoTipo: string;
  objetoId?: string | null;
  detalle: unknown;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: entrada.userId ?? null,
      accion: entrada.accion,
      objetoTipo: entrada.objetoTipo,
      objetoId: entrada.objetoId ?? null,
      detalle: sanearDetalle(entrada.detalle),
      ip: entrada.ip ?? null,
    },
  });
}

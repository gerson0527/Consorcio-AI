import type { Metadata } from "next";

import { metadatosPrivados } from "@/lib/metadatos";
import { prisma } from "@/lib/prisma";
import { exigirAccion } from "@/lib/sesion";
import { formatoFecha } from "@/lib/formato";

export const metadata: Metadata = metadatosPrivados(
  "Auditoría de acciones",
  "Consulta de solo lectura sobre quién hizo cada acción en la plataforma, sin datos personales en el detalle.",
);

export default async function Auditoria({
  searchParams,
}: {
  searchParams: Promise<{ objeto?: string }>;
}) {
  await exigirAccion("ver_auditoria");
  const { objeto } = await searchParams;
  const registros = await prisma.auditLog.findMany({
    where: objeto ? { objetoId: objeto } : undefined,
    orderBy: { creadoEn: "desc" },
    take: 200,
    include: { usuario: { select: { nombre: true, rol: true } } },
  });
  return (
    <main id="contenido" className="flex flex-col gap-4">
      <h1 className="text-3xl font-medium tracking-tight">Auditoría</h1>
      <p className="text-sm text-muted-foreground">
        Consulta de solo lectura. No hay acciones para modificar estos registros.
      </p>
      {registros.length === 0 ? (
        <p className="rounded-[12px] border bg-card p-6">No hay registros.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {registros.map((registro) => (
            <li key={registro.id} className="rounded-[12px] border bg-card p-4 text-sm">
              <p className="font-medium">
                {registro.accion} · {registro.objetoTipo}
              </p>
              <p className="text-muted-foreground">
                {registro.usuario?.nombre ?? "Sistema"} ·{" "}
                {formatoFecha(registro.creadoEn)}
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                {JSON.stringify(registro.detalle, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

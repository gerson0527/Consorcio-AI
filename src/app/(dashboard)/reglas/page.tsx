import type { Metadata } from "next";
import Link from "next/link";

import { metadatosPrivados } from "@/lib/metadatos";

import { aprobarRegla } from "@/app/(dashboard)/reglas/acciones";
import { Barra, MarcaEjemplo, Pastilla } from "@/components/presentacion";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { exigirAccion } from "@/lib/sesion";

export const metadata: Metadata = metadatosPrivados(
  "Reglas sugeridas por la IA",
  "Aprueba o descarta reglas sugeridas a partir de resultados reales. Ninguna queda activa sin una persona.",
);

export default async function ReglasSugeridas() {
  await exigirAccion("aprobar_reglas");
  const [reglas, calibraciones] = await Promise.all([
    prisma.regla.findMany({
      where: { estado: "PENDIENTE" },
      include: { entidad: true },
      orderBy: { creadaEn: "desc" },
    }),
    prisma.entidad.findMany({
      include: { calibraciones: { orderBy: { calculadaEn: "desc" }, take: 1 } },
      orderBy: { nombre: "asc" },
    }),
  ]);
  const ejemplo = calibraciones.some((entidad) => entidad.nombre.toLowerCase().includes("ejemplo"));
  return (
    <main id="contenido" className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight">Reglas sugeridas por la IA</h1>
          {ejemplo ? <MarcaEjemplo /> : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Patrones detectados en resultados reales. Ninguna regla se activa sin tu aprobación.
        </p>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_0.7fr]">
        <section className="flex flex-col gap-4">
          {reglas.length === 0 ? (
            <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              No hay reglas pendientes. Las sugerencias aparecen cuando hay resultados reales suficientes.
            </p>
          ) : (
            reglas.map((regla) => {
              const evidencia = (regla.evidencia ?? {}) as { soporte?: number; desde?: string; hasta?: string };
              const valor = Array.isArray(regla.valor) ? `[${regla.valor.join(", ")}]` : String(regla.valor);
              return (
                <article key={regla.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Pastilla>Pendiente</Pastilla>
                    <p className="font-semibold">{regla.entidad.nombre}</p>
                  </div>
                  <p className="mt-3 rounded-xl bg-muted px-3 py-2 font-mono text-sm">
                    {regla.campo} {regla.operador} {valor}
                  </p>
                  <p className="mt-3 text-sm leading-6">{regla.mensaje}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Evidencia: {evidencia.soporte ?? 0} casos
                    {evidencia.desde ? ` entre ${evidencia.desde} y ${evidencia.hasta}` : ""}.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <form action={aprobarRegla}>
                      <input type="hidden" name="id" value={regla.id} />
                      <input type="hidden" name="decision" value="ACTIVA" />
                      <Button type="submit">Aprobar regla</Button>
                    </form>
                    <form action={aprobarRegla}>
                      <input type="hidden" name="id" value={regla.id} />
                      <input type="hidden" name="decision" value="RECHAZADA" />
                      <Button type="submit" variant="outline" className="bg-card">Descartar</Button>
                    </form>
                    <Link href={`/entidades/${regla.entidadId}`} className="px-2 text-sm font-medium text-primary">
                      Ver casos
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>
        <aside className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Calibración por entidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">Aprobación predicha frente a la real</p>
          <ul className="mt-4 flex flex-col gap-4">
            {calibraciones.map((entidad) => {
              const ultima = entidad.calibraciones[0];
              const suficiente = Boolean(ultima && ultima.muestras >= 30);
              const predicha = suficiente ? Math.round(ultima!.aprobacionPredicha * 100) : 0;
              const real = suficiente ? Math.round(ultima!.aprobacionReal * 100) : 0;
              return (
                <li key={entidad.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{entidad.nombre}</span>
                    <span className="text-muted-foreground">
                      {suficiente ? `${predicha} % / ${real} %` : "Sin muestras"}
                    </span>
                  </div>
                  <Barra valor={predicha} tono={predicha >= 50 ? "exito" : "alerta"} />
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Cada vez que un analista registra un resultado real, estas cifras se recalibran.
          </p>
        </aside>
      </div>
    </main>
  );
}

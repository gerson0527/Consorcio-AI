import type { Metadata } from "next";
import Link from "next/link";

import { metadatosPrivados } from "@/lib/metadatos";

import { guardarEntidad, subirPolitica } from "@/app/(dashboard)/entidades/acciones";
import { BotonSubirPolitica } from "@/components/boton-subir-politica";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarcaEjemplo, Pastilla, entidadLegible } from "@/components/presentacion";
import { puede } from "@/lib/autorizacion";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

export const metadata: Metadata = metadatosPrivados(
  "Entidades y políticas vigentes",
  "Revisa cada entidad de ejemplo, su política vigente, las reglas activas y la aprobación real cuando hay muestras.",
);

export default async function Entidades() {
  const usuario = await sesionActual();
  const entidades = await prisma.entidad.findMany({
    include: {
      politicas: { where: { vigente: true }, take: 1 },
      reglas: { where: { estado: "ACTIVA" } },
      calibraciones: { orderBy: { calculadaEn: "desc" }, take: 1 },
    },
    orderBy: { nombre: "asc" },
  });
  const ejemplo = entidades.some((entidad) =>
    entidad.nombre.toLowerCase().includes("ejemplo"),
  );
  return (
    <main id="contenido" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight">Entidades</h1>
          {ejemplo ? <MarcaEjemplo /> : null}
        </div>
        {puede(usuario.rol, "editar_entidades") ? (
          <details className="relative">
            <summary className="flex h-11 cursor-pointer list-none items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
              Nueva entidad
            </summary>
            <form
              action={guardarEntidad}
              className="absolute right-0 z-10 mt-2 grid w-80 gap-3 rounded-2xl border bg-card p-4 shadow-lg"
            >
              <Input
                name="nombre"
                required
                placeholder="Nombre de ejemplo"
                className="h-11"
                aria-label="Nombre"
              />
              <select
                name="tipo"
                className="h-11 rounded-xl border px-3 text-sm"
                aria-label="Tipo"
              >
                <option value="BANCO">Banco</option>
                <option value="FINANCIERA">Financiera</option>
                <option value="COOPERATIVA">Cooperativa</option>
              </select>
              <Button type="submit">Crear entidad de ejemplo</Button>
            </form>
          </details>
        ) : null}
      </div>
      {entidades.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 shadow-sm">
          No hay entidades cargadas.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entidades.map((entidad) => {
            const calibracion = entidad.calibraciones[0];
            return (
              <article
                key={entidad.id}
                className="rounded-xl border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{entidad.nombre}</h2>
                    <p className="text-sm text-muted-foreground">
                      {entidadLegible(entidad.tipo)}
                    </p>
                  </div>
                  {entidad.activa ? (
                    <Pastilla>Activa</Pastilla>
                  ) : (
                    <Pastilla>Inactiva</Pastilla>
                  )}
                </div>
                <dl className="mt-3">
                  <Dato
                    etiqueta="Política vigente"
                    valor={
                      entidad.politicas[0]
                        ? `Versión ${entidad.politicas[0].version}`
                        : "Sin cargar"
                    }
                  />
                  <Dato etiqueta="Reglas activas" valor={String(entidad.reglas.length)} />
                  <Dato
                    etiqueta="Aprobación real"
                    valor={
                      calibracion && calibracion.muestras >= 30
                        ? `${Math.round(calibracion.aprobacionReal * 100)} %`
                        : "Sin muestras"
                    }
                  />
                </dl>
                <Button
                  nativeButton={false}
                  variant="outline"
                  className="mt-3 w-full bg-card"
                  render={<Link href={`/entidades/${entidad.id}`} />}
                >
                  Ver política y reglas
                </Button>
              </article>
            );
          })}
        </div>
      )}
      {puede(usuario.rol, "subir_politica") && entidades.length > 0 ? (
        <form
          action={subirPolitica}
          className="flex flex-col gap-4 rounded-2xl border border-dashed bg-card p-5 md:flex-row md:items-center"
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Subir una política nueva</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sube la política en Markdown (.md). El sistema la usa de inmediato y
              conserva la versión anterior.
            </p>
          </div>
          <select
            name="entidadId"
            required
            className="h-11 rounded-xl border px-3 text-sm"
            aria-label="Entidad"
          >
            {entidades.map((entidad) => (
              <option key={entidad.id} value={entidad.id}>
                {entidad.nombre}
              </option>
            ))}
          </select>
          <Input
            name="archivo"
            type="file"
            accept=".md,text/markdown,text/plain"
            required
            className="h-11 max-w-xs bg-card"
            aria-label="Archivo Markdown de la política"
          />
          <BotonSubirPolitica />
        </form>
      ) : null}
    </main>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="font-semibold">{valor}</dd>
    </div>
  );
}

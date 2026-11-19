import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { metadatosPrivados } from "@/lib/metadatos";

import {
  crearReglasDesdePolitica,
  retirarReglasActivas,
  subirPolitica,
} from "@/app/(dashboard)/entidades/acciones";
import { BotonGenerarReglas } from "@/components/boton-generar-reglas";
import { BotonSubirPolitica } from "@/components/boton-subir-politica";
import { Pastilla } from "@/components/presentacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { puede } from "@/lib/autorizacion";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entidad = await prisma.entidad.findUnique({
    where: { id },
    select: { nombre: true },
  });
  const nombre = entidad?.nombre ?? "Entidad";
  return metadatosPrivados(
    `Política de ${nombre}`,
    `Versiones de la política y reglas de ${nombre}. La versión anterior se conserva al subir una nueva.`,
  );
}

export default async function DetalleEntidad({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    aviso?: string;
    version?: string;
    reglas?: string;
    cantidad?: string;
  }>;
}) {
  const usuario = await sesionActual();
  const { id } = await params;
  const consulta = await searchParams;
  const entidad = await prisma.entidad.findUnique({
    where: { id },
    include: {
      politicas: {
        orderBy: { version: "desc" },
        include: { fragmentos: { orderBy: { orden: "asc" } } },
      },
      reglas: {
        where: {
          OR: [{ estado: "ACTIVA" }, { origen: "SUGERIDA_IA", estado: "PENDIENTE" }],
        },
        orderBy: { creadaEn: "desc" },
      },
    },
  });
  if (!entidad) notFound();
  const seleccionada =
    entidad.politicas.find((politica) => String(politica.version) === consulta.version) ??
    entidad.politicas[0];
  const reglasSugeridas = entidad.reglas.filter((regla) => {
    if (regla.estado !== "PENDIENTE") return false;
    const evidencia =
      regla.evidencia &&
      typeof regla.evidencia === "object" &&
      !Array.isArray(regla.evidencia)
        ? regla.evidencia
        : null;
    return evidencia?.fuente === "politica" && evidencia.politicaId === seleccionada?.id;
  });
  const reglasActivas = entidad.reglas.filter((regla) => regla.estado === "ACTIVA");
  return (
    <main id="contenido" className="flex flex-col gap-6">
      <Link href="/entidades" className="text-sm text-muted-foreground">
        Volver a entidades
      </Link>
      <h1 className="text-2xl font-semibold">{entidad.nombre}</h1>
      {consulta.error ? (
        <p className="text-sm text-destructive">
          {consulta.error === "formato"
            ? "La política debe ser un archivo Markdown con extensión .md."
            : consulta.error === "texto"
              ? "El archivo Markdown debe contener al menos 20 caracteres."
              : consulta.error === "regla"
                ? "No se pudo guardar la regla. Revisa los datos ingresados."
                : consulta.error === "fragmentos"
                  ? "Esta versión no tiene contenido guardado para volver a generar reglas."
                  : "El archivo debe ser texto UTF-8 válido y no superar 10 MB."}
        </p>
      ) : null}
      {consulta.aviso === "politica" ? (
        <p className="text-sm" role="status">
          Política cargada.{" "}
          {consulta.reglas === "generadas"
            ? `Se generaron ${consulta.cantidad ?? "0"} reglas sugeridas, pendientes de aprobación. `
            : consulta.reglas === "parciales"
              ? `Se generaron ${consulta.cantidad ?? "0"} propuestas parciales; algunas secciones no pudieron analizarse. Puedes volver a generarlas. `
              : consulta.reglas === "sin_clave"
                ? "No se generaron sugerencias porque falta configurar ANTHROPIC_API_KEY."
                : consulta.reglas === "limite"
                  ? "No se generaron sugerencias porque el documento supera el límite de análisis automático."
                  : consulta.reglas === "error"
                    ? "La IA no pudo analizar las secciones de esta política. La política quedó guardada; inténtalo de nuevo."
                    : "No se encontraron criterios nuevos que los datos disponibles permitan verificar de forma segura."}
          {consulta.reglas === "generadas" || consulta.reglas === "parciales" ? (
            <Link href="/reglas" className="font-medium text-primary underline">
              Revisar propuestas
            </Link>
          ) : null}
        </p>
      ) : null}
      {consulta.aviso === "reglas_retiradas" ? (
        <p className="text-sm" role="status">
          Se retiraron {consulta.cantidad ?? "0"} reglas activas. Se conservan en el
          historial.
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[12px] border bg-card p-4">
          <h2 className="font-medium">Versiones</h2>
          {entidad.politicas.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No hay políticas.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {entidad.politicas.map((politica) => (
                <li key={politica.id}>
                  <Link
                    href={`/entidades/${entidad.id}?version=${politica.version}`}
                    className="text-primary"
                  >
                    Versión {politica.version} {politica.vigente ? "(vigente)" : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {seleccionada && puede(usuario.rol, "subir_politica") ? (
            <form action={crearReglasDesdePolitica} className="mt-4">
              <input type="hidden" name="politicaId" value={seleccionada.id} />
              <BotonGenerarReglas />
            </form>
          ) : null}
          {seleccionada ? (
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-[12px] bg-muted p-3 text-xs">
              {seleccionada.fragmentos
                .map(
                  (fragmento) =>
                    `p.${fragmento.pagina ?? "?"} ${fragmento.seccion ?? ""}\n${fragmento.texto}`,
                )
                .join("\n\n")}
            </pre>
          ) : null}
          {puede(usuario.rol, "subir_politica") ? (
            <form action={subirPolitica} className="mt-4 grid gap-3">
              <input type="hidden" name="entidadId" value={entidad.id} />
              <Input
                name="archivo"
                type="file"
                accept=".md,text/markdown,text/plain"
                required
                className="h-11"
              />
              <p className="text-sm text-muted-foreground">
                Solo archivos Markdown (.md), hasta 10 MB.
              </p>
              <BotonSubirPolitica />
            </form>
          ) : null}
        </section>
        <aside className="rounded-[12px] border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">Reglas activas y sugeridas</h2>
            <Link href="/reglas" className="text-sm font-medium text-primary underline">
              Revisar
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Reglas activas de la entidad y propuestas pendientes para la versión{" "}
            {seleccionada?.version ?? "seleccionada"}.
          </p>
          <div className="mt-4 flex max-h-[34rem] flex-col gap-5 overflow-y-auto">
            <section>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Reglas activas</h3>
                {reglasActivas.length > 0 && puede(usuario.rol, "editar_reglas") ? (
                  <details className="relative">
                    <summary className="cursor-pointer text-xs font-medium text-destructive underline">
                      Retirar reglas
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border bg-card p-3 shadow-lg">
                      <p className="text-sm">
                        Dejarán de aplicarse y se conservarán como rechazadas en el
                        historial.
                      </p>
                      <form action={retirarReglasActivas} className="mt-3">
                        <input type="hidden" name="entidadId" value={entidad.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full text-destructive"
                        >
                          Confirmar retiro ({reglasActivas.length})
                        </Button>
                      </form>
                    </div>
                  </details>
                ) : null}
              </div>
              {reglasActivas.length === 0 ? (
                <p className="mt-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  No hay reglas activas para esta entidad.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-3">
                  {reglasActivas.map((regla) => {
                    const valor = Array.isArray(regla.valor)
                      ? regla.valor.join(", ")
                      : String(regla.valor);
                    return (
                      <li key={regla.id} className="rounded-xl border p-3">
                        <Pastilla>Activa</Pastilla>
                        <p className="mt-2 rounded-lg bg-muted px-2 py-1.5 font-mono text-sm">
                          {regla.campo} {regla.operador} {valor}
                        </p>
                        <p className="mt-2 text-sm">{regla.mensaje}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section>
              <h3 className="text-sm font-semibold">
                Propuestas pendientes · versión {seleccionada?.version ?? "seleccionada"}
              </h3>
              {reglasSugeridas.length === 0 ? (
                <p className="mt-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  Esta versión aún no tiene propuestas pendientes de la IA.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-3">
                  {reglasSugeridas.map((regla) => {
                    const evidencia =
                      regla.evidencia &&
                      typeof regla.evidencia === "object" &&
                      !Array.isArray(regla.evidencia)
                        ? regla.evidencia
                        : null;
                    const cita =
                      typeof evidencia?.cita === "string" ? evidencia.cita : null;
                    const seccion =
                      typeof evidencia?.seccion === "string" ? evidencia.seccion : null;
                    const valor = Array.isArray(regla.valor)
                      ? regla.valor.join(", ")
                      : String(regla.valor);
                    return (
                      <li key={regla.id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Pastilla>Pendiente</Pastilla>
                          {seccion ? (
                            <span className="truncate text-xs text-muted-foreground">
                              {seccion}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 rounded-lg bg-muted px-2 py-1.5 font-mono text-sm">
                          {regla.campo} {regla.operador} {valor}
                        </p>
                        <p className="mt-2 text-sm">{regla.mensaje}</p>
                        {cita ? (
                          <blockquote className="mt-2 border-l-2 pl-2 text-xs text-muted-foreground">
                            “{cita}”
                          </blockquote>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}

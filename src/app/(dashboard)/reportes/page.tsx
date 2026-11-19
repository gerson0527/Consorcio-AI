import type { Metadata } from "next";

import { previsualizarCsv } from "@/app/(dashboard)/reglas/acciones";
import { metadatosPrivados } from "@/lib/metadatos";
import { Barra, MarcaEjemplo } from "@/components/presentacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { puede } from "@/lib/autorizacion";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";
import { resumirReporte, type FilaReporte } from "@/modules/reportes";

export const metadata: Metadata = metadatosPrivados(
  "Reportes del preanálisis",
  "Mide casos evaluados, tasa de aprobación, aciertos de la recomendación y los motivos de rechazo del periodo.",
);

const campo =
  "h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export default async function Reportes({
  searchParams,
}: {
  searchParams: Promise<{
    desde?: string;
    hasta?: string;
    periodo?: string;
    aviso?: string;
    error?: string;
  }>;
}) {
  const usuario = await sesionActual();
  const filtros = await searchParams;
  const periodo = filtros.periodo ?? "30";
  const hasta = filtros.hasta ? new Date(filtros.hasta) : new Date();
  const desde = filtros.desde
    ? new Date(filtros.desde)
    : new Date(hasta.getTime() - Number(periodo) * 24 * 60 * 60 * 1000);
  const [evaluaciones, ejemplos] = await Promise.all([
    prisma.evaluacion.findMany({
      where: {
        creadaEn: { gte: desde, lte: hasta },
        ...(usuario.rol === "ANALISTA"
          ? { caso: { is: { analistaId: usuario.id } } }
          : {}),
      },
      include: { entidad: true, resultado: true, caso: true },
    }),
    prisma.entidad.count({
      where: { nombre: { contains: "ejemplo", mode: "insensitive" } },
    }),
  ]);
  const filas: FilaReporte[] = evaluaciones.map((evaluacion) => ({
    casoId: evaluacion.casoId,
    entidad: evaluacion.entidad.nombre,
    veredicto: evaluacion.veredicto,
    resultado:
      evaluacion.resultado && evaluacion.resultado.estado !== "PENDIENTE"
        ? evaluacion.resultado.estado
        : null,
    motivo: evaluacion.resultado?.motivo ?? null,
    creadoEn: evaluacion.caso.creadoEn,
    resultadoEn: evaluacion.resultado?.registradoEn ?? null,
  }));
  const resumen = resumirReporte(filas);
  const conResultado = filas.filter((fila) => fila.resultado);
  const aprobados = conResultado.filter((fila) => fila.resultado === "APROBADO").length;
  const tasa = conResultado.length
    ? Math.round((aprobados / conResultado.length) * 100)
    : null;
  const rechazos = resumen.motivos.reduce((total, motivo) => total + motivo.cantidad, 0);
  const minutos =
    resumen.tiempoPromedioMs === null
      ? null
      : Math.max(1, Math.round(resumen.tiempoPromedioMs / 60000));
  const inicioMs = desde.getTime();
  const duracionMs = Math.max(1, hasta.getTime() - inicioMs);
  const valoresGrafica = Array.from({ length: 30 }, () => 0);
  for (const fila of filas) {
    const diferencia = fila.creadoEn.getTime() - inicioMs;
    if (diferencia < 0 || diferencia > duracionMs) continue;
    const indice = Math.min(29, Math.floor((diferencia / duracionMs) * 30));
    valoresGrafica[indice] += 1;
  }
  const maxGrafica = Math.max(4, ...valoresGrafica);
  const puntos = valoresGrafica.map((valor, indice) => ({
    x: 54 + (indice / (valoresGrafica.length - 1)) * 752,
    y: 190 - (valor / maxGrafica) * 156,
  }));
  const linea = puntos
    .map((punto, indice) => `${indice === 0 ? "M" : "L"} ${punto.x} ${punto.y}`)
    .join(" ");
  const area = `${linea} L ${puntos[puntos.length - 1].x} 190 L ${puntos[0].x} 190 Z`;
  const marcasFecha = [0, 7, 14, 21, 29].map((indice) =>
    new Date(inicioMs + duracionMs * (indice / 29)).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    }),
  );

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1500px] flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight">Reportes</h1>
            {ejemplos > 0 ? <MarcaEjemplo /> : null}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Revisa el comportamiento de los preanálisis y los resultados de las entidades.
          </p>
        </div>
        <form className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-soft">
          <label className="sr-only" htmlFor="periodo">
            Periodo
          </label>
          <select
            id="periodo"
            name="periodo"
            defaultValue={periodo}
            className={`${campo} border-transparent bg-transparent`}
          >
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <Button type="submit" className="h-10 rounded-lg px-4">
            Ver
          </Button>
        </form>
      </div>
      {filtros.error ? (
        <p className="text-sm text-destructive">El archivo no se pudo leer.</p>
      ) : null}
      {filtros.aviso ? (
        <p className="text-sm text-success">Importación confirmada: {filtros.aviso}.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta titulo="Casos evaluados" valor={String(resumen.casos)} />
        <Tarjeta titulo="Tasa de aprobación" valor={tasa === null ? "—" : `${tasa} %`} />
        <Tarjeta
          titulo="Aciertos de la recomendación"
          valor={
            resumen.coincidencia === null
              ? "—"
              : `${Math.round(resumen.coincidencia * 100)} %`
          }
        />
        <Tarjeta
          titulo="Tiempo promedio por caso"
          valor={
            minutos === null
              ? "—"
              : minutos < 60
                ? `${minutos} min`
                : `${Math.round(minutos / 60)} h`
          }
        />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Evaluaciones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Volumen de casos durante el periodo seleccionado
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Casos evaluados
            </span>
          </div>
          <div className="mt-5 overflow-hidden">
            <svg
              role="img"
              aria-label={`Evaluaciones por periodo: ${resumen.casos} casos`}
              viewBox="0 0 840 240"
              preserveAspectRatio="none"
              className="h-56 w-full overflow-visible"
            >
              <defs>
                <linearGradient id="evaluaciones-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[34, 86, 138, 190].map((y) => (
                <line
                  key={y}
                  x1="54"
                  x2="806"
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 5"
                />
              ))}
              <text
                x="42"
                y="38"
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize="10"
              >
                {maxGrafica}
              </text>
              <text
                x="42"
                y="142"
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize="10"
              >
                {Math.round(maxGrafica / 2)}
              </text>
              <text
                x="42"
                y="194"
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize="10"
              >
                0
              </text>
              <path d={area} fill="url(#evaluaciones-area)" />
              <path
                d={linea}
                fill="none"
                stroke="var(--chart-1)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
              {puntos.map((punto, indice) =>
                valoresGrafica[indice] > 0 ? (
                  <circle
                    key={indice}
                    cx={punto.x}
                    cy={punto.y}
                    r="2.5"
                    fill="var(--chart-1)"
                  />
                ) : null,
              )}
              {marcasFecha.map((marca, indice) => (
                <text
                  key={`${marca}-${indice}`}
                  x={54 + (indice / (marcasFecha.length - 1)) * 752}
                  y="220"
                  textAnchor={indice === 0 ? "start" : indice === 4 ? "end" : "middle"}
                  fill="var(--muted-foreground)"
                  fontSize="10"
                >
                  {marca}
                </text>
              ))}
            </svg>
          </div>
          {resumen.casos === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              No hay evaluaciones registradas en este periodo.
            </p>
          ) : null}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
          <h2 className="text-base font-semibold">Aprobación por entidad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Porcentaje de casos aprobados sobre los enviados
          </p>
          {resumen.tasaPorEntidad.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay evaluaciones en el periodo.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {resumen.tasaPorEntidad.map((entidad) => (
                <li
                  key={entidad.entidad}
                  className="grid grid-cols-[140px_1fr_48px] items-center gap-3 text-sm"
                >
                  <span>{entidad.entidad}</span>
                  <Barra valor={entidad.tasaAprobacion * 100} />
                  <span className="text-right font-semibold">
                    {Math.round(entidad.tasaAprobacion * 100)} %
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
          <h2 className="text-base font-semibold">Motivos de rechazo más comunes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registrados por los analistas
          </p>
          {resumen.motivos.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay rechazos registrados.
            </p>
          ) : (
            <ul className="mt-2">
              {resumen.motivos.map((motivo) => (
                <li
                  key={motivo.motivo}
                  className="flex items-center justify-between gap-3 border-b py-3 text-sm last:border-0"
                >
                  <span>{motivo.motivo}</span>
                  <span className="font-semibold">
                    {rechazos
                      ? `${Math.round((motivo.cantidad / rechazos) * 100)} %`
                      : motivo.cantidad}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <a
            className="mt-4 inline-flex text-sm font-medium text-primary"
            href={`/api/reportes/csv?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`}
          >
            Exportar CSV
          </a>
        </section>
      </div>
      {puede(usuario.rol, "importar_historico") ? (
        <form
          action={previsualizarCsv}
          className="rounded-2xl border border-dashed bg-card p-5"
        >
          <h2 className="font-semibold">Carga de histórico</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Encabezado: documentoHash,entidad,estado,motivo. Nada se guarda hasta
            confirmar la vista previa.
          </p>
          <Input
            name="archivo"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-3 h-11 max-w-md"
          />
          <Button type="submit" className="mt-3" variant="outline">
            Previsualizar
          </Button>
        </form>
      ) : null}
    </main>
  );
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-3xl font-medium tracking-tight">{valor}</p>
    </article>
  );
}

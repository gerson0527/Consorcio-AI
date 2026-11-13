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

const campo = "h-11 rounded-xl border bg-card px-3 text-sm";

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

  return (
    <main id="contenido" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight">Reportes</h1>
          {ejemplos > 0 ? <MarcaEjemplo /> : null}
        </div>
        <form className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="periodo">
            Periodo
          </label>
          <select id="periodo" name="periodo" defaultValue={periodo} className={campo}>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <Button type="submit" variant="outline" className="bg-card">
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
      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Aprobación por entidad</h2>
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
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Motivos de rechazo más comunes</h2>
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
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{valor}</p>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { metadatosPrivados } from "@/lib/metadatos";

import {
  editarCliente,
  evaluar,
  registrarResultado,
  subirDocumento,
  suprimirCliente,
} from "@/app/(dashboard)/clientes/acciones";
import {
  Barra,
  MarcaEjemplo,
  Pastilla,
  documentoLegible,
  textoVeredicto,
} from "@/components/presentacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { urlFirmada } from "@/lib/almacen";
import { filtroClienteAccesible } from "@/lib/acceso-clientes";
import { puede } from "@/lib/autorizacion";
import { documentoEnmascarado } from "@/lib/campos";
import { formatoCop } from "@/lib/formato";
import { redisDisponible } from "@/jobs/cola";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";
import type { Perfil } from "@/modules/ingesta/perfil";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const usuario = await sesionActual();
  const { id } = await params;
  const cliente = await prisma.cliente.findFirst({
    where: { id, suprimidoEn: null, ...filtroClienteAccesible(usuario) },
    select: { nombre: true, suprimidoEn: true },
  });
  const nombre = cliente && !cliente.suprimidoEn ? cliente.nombre : "Cliente";
  return metadatosPrivados(
    `Caso de ${nombre}`,
    `Perfil extraído, documentos y ranking de entidades para el preanálisis de ${nombre}.`,
  );
}

export default async function CasoCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const usuario = await sesionActual();
  const { id } = await params;
  const avisos = await searchParams;
  const cliente = await prisma.cliente.findFirst({
    where: { id, suprimidoEn: null, ...filtroClienteAccesible(usuario) },
    include: {
      casos: {
        orderBy: { creadoEn: "desc" },
        take: 1,
        include: {
          documentos: { orderBy: { id: "asc" } },
          evaluaciones: {
            orderBy: { ranking: "asc" },
            include: { entidad: true, politica: true, resultado: true },
          },
        },
      },
    },
  });
  if (!cliente || cliente.suprimidoEn) notFound();
  const caso = cliente.casos[0];
  const perfil = (caso?.perfil ?? null) as Perfil | null;
  const soloLectura = !puede(usuario.rol, "editar_clientes");
  const cerrado = Boolean(
    caso?.evaluaciones.some(
      (evaluacion) => evaluacion.resultado && evaluacion.resultado.estado !== "PENDIENTE",
    ),
  );
  const ejemplo = cliente.nombre.toLowerCase().includes("ejemplo");
  const lista = Boolean(caso?.evaluaciones.length) && !perfil?.revisar.length;
  const documentos = await Promise.all(
    (caso?.documentos ?? []).map(async (documento) => ({
      ...documento,
      enlace: await urlFirmada(documento.archivoKey),
    })),
  );
  const endeudamiento =
    perfil?.ingresoMensual && perfil.obligacionesMensuales !== null
      ? Math.round((perfil.obligacionesMensuales / perfil.ingresoMensual) * 100)
      : null;
  const control =
    "h-11 w-full rounded-lg border border-input px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

  return (
    <main id="contenido" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/clientes" className="hover:text-foreground">
              Clientes
            </Link>
            <span> / Caso</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-tight">{cliente.nombre}</h1>
            {lista ? <Pastilla>Evaluación lista</Pastilla> : null}
            {ejemplo ? <MarcaEjemplo /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Doc. {documentoEnmascarado(cliente.documentoCifrado)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {caso && puede(usuario.rol, "evaluar") ? (
            <form action={evaluar}>
              <input type="hidden" name="casoId" value={caso.id} />
              <Button type="submit" variant="outline" className="bg-card">
                Volver a evaluar
              </Button>
            </form>
          ) : null}
          {caso?.evaluaciones.length ? (
            <Button nativeButton={false} render={<a href="#resultado" />}>
              Registrar resultado
            </Button>
          ) : null}
        </div>
      </div>
      {avisos.error === "cerrado" ? (
        <p className="text-sm text-destructive" role="alert">
          Este caso ya tiene un resultado registrado y no se puede editar.
        </p>
      ) : null}
      {avisos.error === "procesamiento_pausado" ? (
        <p className="text-sm text-destructive" role="alert">
          La carga de documentos está pausada mientras se configura Redis. No se guardó
          ningún archivo.
        </p>
      ) : null}
      {avisos.error &&
      avisos.error !== "cerrado" &&
      avisos.error !== "procesamiento_pausado" ? (
        <p className="text-sm text-destructive" role="alert">
          No se pudo completar la acción. Revisa el archivo o los datos.
        </p>
      ) : null}
      {avisos.aviso === "guardado" ? (
        <p className="text-sm text-success">Los datos del cliente quedaron guardados.</p>
      ) : null}
      {avisos.aviso && avisos.aviso !== "guardado" ? (
        <p className="text-sm text-success">Acción registrada.</p>
      ) : null}
      {soloLectura || cerrado ? null : (
        <form action={editarCliente} className="rounded-xl border bg-card p-4">
          <input type="hidden" name="id" value={cliente.id} />
          <h2 className="font-semibold">Datos del caso</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              Nombre
              <Input
                name="nombre"
                defaultValue={cliente.nombre}
                required
                minLength={3}
                autoComplete="name"
                className="h-11 bg-background"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              Tipo de crédito
              <select
                name="tipoCredito"
                defaultValue={caso?.tipoCredito ?? "LIBRANZA"}
                className={`${control} bg-background`}
              >
                <option value="LIBRANZA">Libranza</option>
                <option value="CONSUMO">Consumo</option>
                <option value="VEHICULO">Vehículo</option>
                <option value="VIVIENDA">Vivienda</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <article className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Perfil extraído</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Datos leídos de los documentos del cliente
            </p>
            {!perfil ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Aún no hay datos leídos de los documentos.
              </p>
            ) : (
              <dl className="mt-2">
                <Fila
                  etiqueta="Ingreso mensual"
                  valor={
                    perfil.ingresoMensual === null
                      ? "Sin dato"
                      : formatoCop(perfil.ingresoMensual)
                  }
                  revisar={
                    perfil.revisar.includes("totalDevengado") ||
                    perfil.revisar.includes("salarioBasico")
                  }
                />
                <Fila
                  etiqueta="Tipo de contrato"
                  valor={perfil.tipoContrato ?? "Sin dato"}
                  revisar={perfil.revisar.includes("tipoContrato")}
                />
                <Fila
                  etiqueta="Antigüedad laboral"
                  valor={
                    perfil.antiguedadLaboralMeses === null
                      ? "Sin dato"
                      : `${perfil.antiguedadLaboralMeses} meses`
                  }
                  revisar={perfil.revisar.includes("fechaIngreso")}
                />
                <Fila
                  etiqueta="Endeudamiento"
                  valor={endeudamiento === null ? "Sin dato" : `${endeudamiento} %`}
                  revisar={perfil.revisar.includes("obligacionesMensuales")}
                />
                <Fila
                  etiqueta="Edad"
                  valor={perfil.edad === null ? "Sin dato" : `${perfil.edad} años`}
                  revisar={perfil.revisar.includes("fechaNacimiento")}
                />
              </dl>
            )}
          </article>

          <article className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Documentos</h2>
            {documentos.length ? (
              <ul className="mt-2">
                {documentos.map((documento) => (
                  <li
                    key={documento.id}
                    className="flex items-center justify-between gap-3 border-b py-3 text-sm last:border-0"
                  >
                    <a
                      className="underline-offset-2 hover:underline"
                      href={documento.enlace}
                    >
                      {documentoLegible(documento.tipo)}
                    </a>
                    <EstadoDocumento estado={documento.estado} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no hay documentos.
              </p>
            )}
            {caso && !soloLectura && redisDisponible() ? (
              <form
                action={subirDocumento}
                className="mt-4 flex flex-col gap-3 border-t pt-4"
              >
                <input type="hidden" name="casoId" value={caso.id} />
                <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  Tipo de documento
                  <select name="tipo" className={`${control} bg-background`}>
                    <option value="cedula">Cédula de ciudadanía</option>
                    <option value="desprendible">Desprendibles de nómina</option>
                    <option value="certificado_laboral">Certificado laboral</option>
                    <option value="extracto">Extracto</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-sm text-muted-foreground">
                  Archivo
                  <input
                    name="archivo"
                    type="file"
                    required
                    className="block h-11 w-full min-w-0 truncate rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-sm file:font-medium file:text-background"
                  />
                </label>
                <Button type="submit" variant="outline" className="bg-background">
                  {documentos.length ? "Subir otro documento" : "Subir documento"}
                </Button>
              </form>
            ) : caso && !soloLectura ? (
              <p
                className="mt-4 border-t pt-4 text-sm text-muted-foreground"
                role="status"
              >
                La carga y extracción de documentos estará disponible cuando se configure
                Redis.
              </p>
            ) : null}
          </article>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
          <div>
            <h2 className="font-semibold">Mejores opciones</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ordenadas por probabilidad de aprobación
            </p>
          </div>
          {caso?.evaluaciones.length ? (
            caso.evaluaciones.map((evaluacion, indice) => {
              const cita = (
                evaluacion.citas as Array<{ seccion?: string; pagina?: number }>
              )[0];
              const porcentaje =
                evaluacion.probabilidad === null
                  ? null
                  : Math.round(evaluacion.probabilidad * 100);
              const favorable =
                evaluacion.veredicto === "FAVORABLE" && evaluacion.cumpleReglas;
              const tono = favorable
                ? "exito"
                : evaluacion.veredicto === "INSUFICIENTE"
                  ? "primario"
                  : "alerta";
              return (
                <article
                  key={evaluacion.id}
                  id={indice === 0 ? "resultado" : undefined}
                  className={
                    favorable
                      ? "rounded-lg border-2 border-primary bg-background p-4"
                      : "rounded-lg border bg-background p-4"
                  }
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        indice === 0
                          ? "flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                          : "flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
                      }
                    >
                      {evaluacion.ranking}
                    </span>
                    <p className="text-lg font-semibold">{evaluacion.entidad.nombre}</p>
                    <Pastilla>
                      {textoVeredicto(evaluacion.veredicto, evaluacion.cumpleReglas)}
                    </Pastilla>
                    <p className="ml-auto text-2xl font-semibold">
                      {porcentaje === null ? "—" : `${porcentaje} %`}
                    </p>
                  </div>
                  <div className="mt-3">
                    <Barra valor={porcentaje ?? 0} tono={tono} />
                  </div>
                  <p className="mt-3 text-sm leading-6">{evaluacion.explicacion}</p>
                  <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Fuente: Política {evaluacion.entidad.nombre}, versión{" "}
                    {evaluacion.politica.version}
                    {cita?.seccion ? ` · ${cita.seccion}` : ""}
                    {cita?.pagina ? `, pág. ${cita.pagina}` : ""}
                  </p>
                  {puede(usuario.rol, "registrar_resultado") ? (
                    <form action={registrarResultado} className="mt-4 grid gap-2">
                      <input type="hidden" name="evaluacionId" value={evaluacion.id} />
                      <select
                        name="estado"
                        className={`${control} bg-card`}
                        defaultValue={
                          evaluacion.resultado?.estado === "RECHAZADO"
                            ? "RECHAZADO"
                            : "APROBADO"
                        }
                        aria-label="Resultado real"
                      >
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </select>
                      <Input
                        name="motivo"
                        required
                        minLength={3}
                        placeholder="Motivo del resultado real"
                        className="h-11 bg-card"
                        defaultValue={evaluacion.resultado?.motivo ?? ""}
                      />
                      <Button type="submit" className="justify-self-start">
                        Registrar resultado
                      </Button>
                    </form>
                  ) : null}
                </article>
              );
            })
          ) : (
            <p className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
              Todavía no hay una evaluación.
            </p>
          )}
          <p className="rounded-lg bg-ia-muted px-4 py-3 text-sm text-ia">
            La IA recomienda y cita la política usada. La decisión final es siempre del
            analista.
          </p>
        </section>
      </div>
      {puede(usuario.rol, "suprimir_datos") ? (
        <form action={suprimirCliente} className="flex justify-end">
          <input type="hidden" name="id" value={cliente.id} />
          <Button type="submit" variant="destructive">
            Suprimir datos personales
          </Button>
        </form>
      ) : null}
    </main>
  );
}

function Fila({
  etiqueta,
  valor,
  revisar,
}: {
  etiqueta: string;
  valor: string;
  revisar: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 text-sm last:border-0">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="flex items-center gap-2 font-medium">
        {revisar ? (
          <span className="rounded-full bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning">
            Revisar
          </span>
        ) : null}
        {valor}
      </dd>
    </div>
  );
}

function EstadoDocumento({ estado }: { estado: string }) {
  if (estado === "PROCESADO")
    return <span className="font-medium text-success">Procesado</span>;
  if (estado === "REVISAR" || estado === "ERROR")
    return <span className="font-medium text-warning">Revisar</span>;
  return <span className="font-medium text-ia">Procesando</span>;
}

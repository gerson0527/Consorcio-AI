import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { buttonVariants } from "@/components/ui/button";

const descripcion =
  "Consorcio AI ordena opciones de crédito para el analista. Compara el perfil con la política vigente y deja la decisión final en la persona.";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: descripcion,
};

const pasos = [
  {
    numero: "01",
    titulo: "Documentos",
    texto: "El analista carga cédula, desprendibles y los soportes del caso.",
  },
  {
    numero: "02",
    titulo: "Perfil",
    texto: "La plataforma lee ingreso, contrato, antigüedad y endeudamiento, y marca lo que hay que revisar.",
  },
  {
    numero: "03",
    titulo: "Política vigente",
    texto: "Cada entidad se compara con su política versionada, no con un criterio suelto.",
  },
  {
    numero: "04",
    titulo: "Ranking citado",
    texto: "Las opciones quedan ordenadas, con la fuente. El analista registra el resultado real.",
  },
];

const vista = [
  { etiqueta: "Cliente", valor: "Ejemplo" },
  { etiqueta: "Crédito", valor: "Libranza" },
  { etiqueta: "Documentos", valor: "Pendiente de carga" },
  { etiqueta: "Mejor opción", valor: "Sin evaluar" },
  { etiqueta: "Estado", valor: "Por revisar" },
];

export default async function Inicio() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const datos = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Consorcio AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: descripcion,
    inLanguage: "es-CO",
  };

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }} />
      <header className="sticky top-0 z-10 border-b bg-background/95">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">CF</span>
            <span className="text-sm">Consorcio AI</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Consorcio Finance</span>
          </Link>
          <nav aria-label="Secciones de la portada" className="hidden items-center gap-1 md:flex">
            <a href="#proceso" className="inline-flex h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground">Proceso</a>
            <a href="#principio" className="inline-flex h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground">Principio</a>
          </nav>
          <Link className={buttonVariants({ variant: "outline" })} href="/login">
            Ingresar a la plataforma
          </Link>
        </div>
      </header>

      <main id="contenido" className="flex flex-1 flex-col">
        <section className="border-b">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div>
              <p className="font-mono text-xs text-muted-foreground">Preanálisis para equipos de crédito</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Preanálisis crediticio
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                La plataforma prepara el perfil del cliente, lo compara con las políticas de cada entidad y ordena las opciones. No aprueba ni rechaza un crédito.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link className={buttonVariants()} href="/login">
                  Ingresar a la plataforma
                </Link>
                <a href="#proceso" className="inline-flex h-11 items-center px-2 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                  Ver el proceso
                </a>
              </div>
            </div>

            <figure className="overflow-hidden rounded-lg border bg-background" aria-label="Vista de ejemplo del caso, sin datos reales">
              <div className="flex h-9 items-center gap-2 border-b bg-sidebar px-3">
                <span className="size-2.5 rounded-full bg-chrome-close" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-chrome-min" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-chrome-max" aria-hidden="true" />
                <figcaption className="font-mono text-xs text-muted-foreground">Caso · Datos de ejemplo</figcaption>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Cliente de ejemplo</p>
                  <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Sin evaluar</span>
                </div>
                <dl className="mt-3">
                  {vista.map((fila) => (
                    <div key={fila.etiqueta} className="flex items-center justify-between gap-3 border-b py-2.5 text-sm last:border-0">
                      <dt className="text-muted-foreground">{fila.etiqueta}</dt>
                      <dd className="font-medium">{fila.valor}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 rounded-lg bg-ia-muted px-3 py-2 text-xs leading-5 text-ia">
                  La IA recomienda y cita la política usada. La decisión final es del analista.
                </p>
              </div>
            </figure>
          </div>
        </section>

        <section id="proceso" className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Qué prepara</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Documentos, perfil estructurado y ranking con la política citada. El analista ve el origen de cada recomendación.
            </p>
            <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {pasos.map((paso) => (
                <li key={paso.numero} className="rounded-lg border bg-card p-4">
                  <p className="font-mono text-xs text-muted-foreground">{paso.numero}</p>
                  <h3 className="mt-3 font-semibold">{paso.titulo}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{paso.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="principio">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-14 sm:px-6 lg:grid-cols-2">
            <article className="rounded-lg border bg-card p-5">
              <h2 className="text-2xl font-semibold tracking-tight">Principio</h2>
              <p className="mt-3 text-lg leading-8">La IA recomienda, el analista decide.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                El resultado en pantalla es una recomendación. No es una aprobación ni un rechazo de crédito.
              </p>
            </article>
            <article className="rounded-lg border bg-ia-muted p-5">
              <h2 className="text-2xl font-semibold tracking-tight">Aprendizaje</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Las políticas quedan versionadas. La calibración usa resultados reales, y las reglas nuevas las aprueba un administrador antes de quedar activas.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Consorcio Finance. El resultado mostrado es una recomendación, no una decisión de crédito.</p>
          <span className="flex flex-wrap items-center gap-x-4">
            <Link href="/privacidad" className="inline-flex min-h-11 items-center underline-offset-2 hover:text-foreground hover:underline">
              Política de privacidad
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center underline-offset-2 hover:text-foreground hover:underline">
              Ingresar a la plataforma
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Check, FileSearch, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const descripcion =
  "Consorcio AI ordena opciones de crédito para el analista. Compara el perfil con la política vigente y deja la decisión final en la persona.";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: descripcion,
};

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
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }}
      />
      <header className="sticky top-0 z-10 border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-xs text-primary-foreground shadow-soft">
              CF
            </span>
            <span>
              <span className="block text-sm leading-4">Consorcio AI</span>
              <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                Preanálisis crediticio
              </span>
            </span>
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href="/login">
            Ingresar
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main id="contenido" className="flex flex-1 flex-col">
        <section className="relative isolate flex flex-1 items-center overflow-hidden bg-gradient-to-b from-background via-background to-mint/25">
          <div
            className="pointer-events-none absolute -right-36 -top-44 -z-10 size-[34rem] rounded-full bg-mint/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
                <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                PREANÁLISIS PARA EQUIPOS DE CRÉDITO
              </p>
              <h1 className="mt-6 max-w-xl text-4xl font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                Una vista clara para cada decisión de crédito.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Compara el perfil del cliente con las políticas vigentes, revisa las
                opciones y mantén la fuente a la vista. La decisión final sigue en manos
                de quien gestiona el caso.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link className={buttonVariants({ size: "lg" })} href="/login">
                  Entrar a la plataforma
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
                <Link
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  href="/privacidad"
                >
                  Conocer privacidad
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-success" aria-hidden="true" />
                Recomendaciones con trazabilidad; sin decisiones automáticas de crédito.
              </p>
            </div>

            <figure
              className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card"
              aria-label="Vista de ejemplo del caso, sin datos reales"
            >
              <div className="flex h-12 items-center justify-between gap-3 border-b border-border bg-sidebar px-4">
                <figcaption className="flex items-center gap-2 text-xs font-medium">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-[9px] text-primary-foreground">
                    CF
                  </span>
                  Espacio de trabajo
                </figcaption>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-muted px-2.5 py-1 text-[10px] font-medium text-success">
                  <Check className="size-3" aria-hidden="true" />
                  Vista de ejemplo
                </span>
              </div>
              <div className="grid gap-5 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">CASO DE PREANÁLISIS</p>
                    <p className="mt-1 text-lg font-medium tracking-tight">
                      Cliente de ejemplo
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    Sin evaluar
                  </span>
                </div>
                <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                  <dl className="grid grid-cols-2 gap-2">
                    {vista.map((fila) => (
                      <div
                        key={fila.etiqueta}
                        className="rounded-xl border border-border bg-background/70 p-3"
                      >
                        <dt className="text-[10px] text-muted-foreground">
                          {fila.etiqueta}
                        </dt>
                        <dd className="mt-1 text-xs font-medium">{fila.valor}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">Comparación de opciones</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Datos demostrativos
                        </p>
                      </div>
                      <FileSearch
                        className="size-4 text-mint-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <svg
                      viewBox="0 0 360 110"
                      className="mt-4 h-24 w-full"
                      role="img"
                      aria-label="Gráfico ilustrativo de comparación"
                    >
                      <path
                        d="M4 88 C 34 85, 40 28, 76 48 S 130 82, 160 60 S 215 26, 242 45 S 298 69, 356 18 L 356 106 L 4 106 Z"
                        fill="var(--mint)"
                        opacity="0.55"
                      />
                      <path
                        d="M4 88 C 34 85, 40 28, 76 48 S 130 82, 160 60 S 215 26, 242 45 S 298 69, 356 18"
                        fill="none"
                        stroke="var(--chart-1)"
                        strokeLinecap="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 105 H356 M4 72 H356 M4 39 H356"
                        fill="none"
                        stroke="var(--border)"
                        strokeDasharray="3 5"
                      />
                    </svg>
                  </div>
                </div>
                <p className="flex items-start gap-2 rounded-xl bg-ia-muted px-3.5 py-3 text-xs leading-5 text-ia">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Cada recomendación conserva la política consultada. La evaluación final
                  corresponde al analista.
                </p>
              </div>
            </figure>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            Consorcio Finance. El resultado mostrado es una recomendación, no una decisión
            de crédito.
          </p>
          <span className="flex flex-wrap items-center gap-x-4">
            <Link
              href="/privacidad"
              className="inline-flex min-h-11 items-center underline-offset-2 hover:text-foreground hover:underline"
            >
              Política de privacidad
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center underline-offset-2 hover:text-foreground hover:underline"
            >
              Ingresar a la plataforma
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}

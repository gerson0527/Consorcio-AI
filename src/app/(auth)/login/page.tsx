import type { Metadata } from "next";
import { FileSearch, Info, ListOrdered, Lock, Mail, Timer } from "lucide-react";
import Link from "next/link";

import { ingresar } from "@/app/(auth)/login/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: { absolute: "Ingresar a Consorcio AI | Preanálisis" },
  description:
    "Acceso de analistas, administradores y auditores al preanálisis. La plataforma recomienda y la persona registra la decisión.",
  alternates: { canonical: "/login" },
};

const apoyos = [
  {
    titulo: "La mejor opción primero",
    texto:
      "Compara el perfil con la política de cada entidad y deja arriba la que más conviene.",
    icono: ListOrdered,
  },
  {
    titulo: "La gestión avanza más rápido",
    texto:
      "Documentos, perfil y política vigente quedan en el mismo caso, sin buscar en varios lados.",
    icono: Timer,
  },
  {
    titulo: "Con la fuente a la vista",
    texto:
      "Cada opción cita la política usada. Quien gestiona el crédito toma la decisión.",
    icono: FileSearch,
  },
];

const campo =
  "h-11 rounded-xl border-input bg-card pl-10 text-foreground placeholder:text-muted-foreground focus-visible:border-ring";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const accesosDesarrollo =
    process.env.NODE_ENV === "development"
      ? [
          { email: "admin@ejemplo.local", rol: "Administrador" },
          { email: "analista@ejemplo.local", rol: "Analista" },
          { email: "auditor@ejemplo.local", rol: "Auditor" },
        ]
      : [];
  return (
    <main
      id="contenido"
      className="relative flex min-h-dvh flex-1 flex-col bg-background text-foreground lg:flex-row"
    >
      <section className="relative flex flex-col justify-between gap-10 overflow-hidden border-b border-sidebar-border bg-sidebar px-6 py-8 lg:w-1/2 lg:border-b-0 lg:border-r lg:px-12 lg:py-10">
        <Cintas />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-soft">
              CF
            </span>
            <span className="text-lg font-semibold tracking-tight">Consorcio AI</span>
          </Link>
          <p className="mt-2 w-fit border-b border-mint-foreground/30 pb-1 text-sm text-muted-foreground">
            Preanálisis crediticio
          </p>
        </div>

        <div className="relative max-w-lg">
          <p className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-card/70 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            ESPACIO DE TRABAJO
          </p>
          <h1 className="mt-5 text-4xl font-medium tracking-tight">Ingresar</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Para quien gestiona el crédito: ve la mejor opción según la política vigente y
            avanza el caso con la fuente citada. La plataforma no aprueba ni rechaza.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {apoyos.map((apoyo) => (
              <li
                key={apoyo.titulo}
                className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-card/80 px-3 py-3 shadow-soft"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint text-mint-foreground">
                  <apoyo.icono className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{apoyo.titulo}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {apoyo.texto}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-mint-foreground" aria-hidden="true" />
          Muestra la mejor opción para agilizar el crédito. La decisión queda en quien lo
          gestiona.
        </p>
      </section>

      <section
        className="flex flex-1 flex-col items-center justify-center px-4 py-10"
        aria-label="Formulario de acceso"
      >
        <div className="w-full max-w-[440px] overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="flex h-12 items-center gap-2 border-b border-border bg-sidebar px-5">
            <span className="size-2 rounded-full bg-chrome-close" aria-hidden="true" />
            <span className="size-2 rounded-full bg-chrome-min" aria-hidden="true" />
            <span className="size-2 rounded-full bg-chrome-max" aria-hidden="true" />
            <p className="ml-1 text-xs font-medium text-muted-foreground">
              Inicio de sesión
            </p>
          </div>
          <form action={ingresar} className="flex flex-col gap-4 p-5 sm:p-7">
            <div>
              <p className="text-lg font-medium tracking-tight">Cuenta del equipo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa el correo y la contraseña que te asignaron.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  required
                  className={campo}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={campo}
                />
              </div>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                Correo o contraseña incorrectos, o demasiados intentos.
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
              >
                Volver al inicio de{" "}
                <span className="ml-1 font-medium text-foreground">
                  Consorcio Finance
                </span>
              </Link>
            </p>
          </form>
          {accesosDesarrollo.length > 0 ? (
            <section
              className="border-t border-border bg-sidebar/60 px-5 py-4"
              aria-label="Accesos de desarrollo"
            >
              <h2 className="text-sm font-medium">Acceso rápido · solo desarrollo</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Contraseña de ejemplo: <span className="font-mono">Ejemplo.2026</span>
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {accesosDesarrollo.map((acceso) => (
                  <li
                    key={acceso.email}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">{acceso.rol}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {acceso.email}
                      </span>
                    </span>
                    <form action={ingresar}>
                      <input type="hidden" name="email" value={acceso.email} />
                      <input type="hidden" name="password" value="Ejemplo.2026" />
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-9 border-border bg-background px-3 text-xs"
                      >
                        Entrar
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <Link
          href="/privacidad"
          className="mt-5 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Política de privacidad
        </Link>
      </section>
    </main>
  );
}

function Cintas() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cinta-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.15" />
          <stop offset="50%" stopColor="var(--chart-2)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="cinta-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-3)" stopOpacity="0.1" />
          <stop offset="45%" stopColor="var(--mint)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0.15" />
        </linearGradient>
        <filter id="suave">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <path
        d="M-80 40 C 140 -20, 260 210, 520 90 S 860 20, 920 180"
        fill="none"
        stroke="url(#cinta-a)"
        strokeWidth="90"
        filter="url(#suave)"
      />
      <path
        d="M-60 820 C 180 700, 300 980, 560 820 S 900 700, 980 900"
        fill="none"
        stroke="url(#cinta-b)"
        strokeWidth="110"
        filter="url(#suave)"
      />
    </svg>
  );
}

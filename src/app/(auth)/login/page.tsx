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
    texto: "Compara el perfil con la política de cada entidad y deja arriba la que más conviene.",
    icono: ListOrdered,
  },
  {
    titulo: "La gestión avanza más rápido",
    texto: "Documentos, perfil y política vigente quedan en el mismo caso, sin buscar en varios lados.",
    icono: Timer,
  },
  {
    titulo: "Con la fuente a la vista",
    texto: "Cada opción cita la política usada. Quien gestiona el crédito toma la decisión.",
    icono: FileSearch,
  },
];

const campo =
  "h-11 border-white/10 bg-[#161822]! pl-10 text-white placeholder:text-[#8b93a7] focus-visible:border-[#7c6cff]";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main id="contenido" className="relative flex min-h-dvh flex-1 flex-col bg-[#07070d] text-white lg:flex-row">
      <section className="relative flex flex-col justify-between gap-10 overflow-hidden bg-[#070b18] px-6 py-8 lg:w-1/2 lg:px-12 lg:py-10">
        <Cintas />
        <div className="relative">
          <p className="text-lg font-semibold tracking-tight">
            Consorcio <span className="bg-gradient-to-r from-[#b9a6ff] to-[#7eb6ff] bg-clip-text text-transparent">AI</span>
          </p>
          <p className="mt-1 w-fit border-b border-[#7c6cff]/70 pb-1 text-sm text-[#c5cbe0]">Preanálisis crediticio</p>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-semibold tracking-tight">Ingresar</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#c5cbe0]">
            Para quien gestiona el crédito: ve la mejor opción según la política vigente y avanza el caso con la fuente citada. La plataforma no aprueba ni rechaza.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {apoyos.map((apoyo) => (
              <li key={apoyo.titulo} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#6d5efc]/20 text-[#c4b5fd]">
                  <apoyo.icono className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{apoyo.titulo}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#b7bdd0]">{apoyo.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-[#b7bdd0]">
          <Info className="size-4 shrink-0 text-[#a78bfa]" aria-hidden="true" />
          Muestra la mejor opción para agilizar el crédito. La decisión queda en quien lo gestiona.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-10" aria-label="Formulario de acceso">
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#10131c] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4">
            <span className="size-2.5 rounded-full bg-[#ff5f56]" aria-hidden="true" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
            <span className="size-2.5 rounded-full bg-[#27c93f]" aria-hidden="true" />
            <p className="font-mono text-xs text-[#b7bdd0]">Sesión</p>
          </div>
          <form action={ingresar} className="flex flex-col gap-4 p-5">
            <div>
              <p className="text-sm font-medium">Cuenta del equipo</p>
              <p className="mt-1 text-sm text-[#b7bdd0]">Usa el correo y la contraseña que te asignaron.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b93a7]" aria-hidden="true" />
                <Input id="email" name="email" type="email" inputMode="email" autoComplete="username" required className={campo} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b93a7]" aria-hidden="true" />
                <Input id="password" name="password" type="password" autoComplete="current-password" required className={campo} />
              </div>
            </div>
            {error ? (
              <p className="text-sm text-[#ff8b8e]" role="alert">
                Correo o contraseña incorrectos, o demasiados intentos.
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full border-0 bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white hover:from-[#6d28d9] hover:to-[#1d4ed8]"
            >
              Entrar
            </Button>
            <p className="text-center text-sm text-[#b7bdd0]">
              <Link href="/" className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">
                Volver al inicio de <span className="ml-1 text-[#c4b5fd]">Consorcio Finance</span>
              </Link>
            </p>
          </form>
        </div>
      </section>
      <Link
        href="/privacidad"
        className="absolute right-4 bottom-4 inline-flex min-h-11 items-center text-sm text-[#c4b5fd] underline-offset-2 hover:underline"
      >
        Política de privacidad
      </Link>
    </main>
  );
}

function Cintas() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cinta-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d5efc" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#5b4dff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="cinta-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#312e81" stopOpacity="0.1" />
          <stop offset="45%" stopColor="#4f46e5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.15" />
        </linearGradient>
        <filter id="suave">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <path d="M-80 40 C 140 -20, 260 210, 520 90 S 860 20, 920 180" fill="none" stroke="url(#cinta-a)" strokeWidth="90" filter="url(#suave)" />
      <path d="M-60 820 C 180 700, 300 980, 560 820 S 900 700, 980 900" fill="none" stroke="url(#cinta-b)" strokeWidth="110" filter="url(#suave)" />
    </svg>
  );
}

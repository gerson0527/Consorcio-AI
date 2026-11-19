"use client";

import { Button } from "@/components/ui/button";

export default function ErrorTablero({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center"
      role="alert"
    >
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <span className="inline-flex rounded-full bg-warning-muted px-3 py-1 text-xs font-medium text-warning">
          Interrupción temporal
        </span>
        <h1 className="mt-4 text-xl font-medium tracking-tight">
          No se pudo cargar esta pantalla
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Revisa la conexión con la base de datos e inténtalo de nuevo.
        </p>
        <Button type="button" className="mt-5" onClick={() => reset()}>
          Reintentar
        </Button>
      </section>
    </main>
  );
}

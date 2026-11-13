"use client";

export default function ErrorTablero({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="contenido" className="rounded-[12px] border bg-card p-6" role="alert">
      <h1 className="text-lg font-semibold">No se pudo cargar esta pantalla</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Revisa la conexión con la base de datos e inténtalo de nuevo.
      </p>
      <button type="button" className="mt-4 min-h-11 underline" onClick={() => reset()}>
        Reintentar
      </button>
    </main>
  );
}

import { LoaderCircle } from "lucide-react";

export default function Cargando() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-xl items-center justify-center">
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-soft"
      >
        <LoaderCircle
          className="size-4 animate-spin text-mint-foreground"
          aria-hidden="true"
        />
        Cargando espacio de trabajo…
      </div>
    </main>
  );
}

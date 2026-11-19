"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BotonSubirPolitica() {
  const { pending } = useFormStatus();
  return (
    <div className="grid gap-2">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        {pending ? "Subiendo y analizando..." : "Subir política Markdown"}
      </Button>
      {pending ? (
        <div
          className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-2xl border border-primary/20 bg-card p-4 text-card-foreground shadow-xl md:right-6 md:left-auto md:w-[26rem]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <LoaderCircle
            className="mt-0.5 size-5 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Subiendo la política</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Estamos guardando el archivo y analizando su contenido para preparar
              sugerencias. No cierres esta página.
            </p>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

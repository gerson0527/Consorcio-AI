"use client";

import { useState } from "react";

import { MAXIMO_ARCHIVO_BYTES } from "@/modules/ingesta/limites";

export function SelectorArchivo() {
  const [error, setError] = useState(false);

  return (
    <>
      <input
        name="archivo"
        type="file"
        required
        onChange={(evento) => {
          const archivo = evento.currentTarget.files?.[0];
          if (archivo && archivo.size > MAXIMO_ARCHIVO_BYTES) {
            evento.currentTarget.value = "";
            setError(true);
            return;
          }
          setError(false);
        }}
        className="block h-11 w-full min-w-0 truncate rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-sm file:font-medium file:text-background"
      />
      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          El archivo supera el límite de 10 MB. Selecciona una imagen o documento más
          pequeño.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Tamaño máximo: 10 MB.</p>
      )}
    </>
  );
}

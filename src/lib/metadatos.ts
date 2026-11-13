import type { Metadata } from "next";

export function metadatosPrivados(titulo: string, descripcion: string): Metadata {
  return {
    title: { absolute: `${titulo} | Consorcio AI` },
    description: descripcion,
    robots: { index: false, follow: false },
  };
}

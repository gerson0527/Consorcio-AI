import { validarArchivo } from "@/modules/ingesta/archivos";

export function leerPoliticaMarkdown(nombre: string, bytes: Buffer) {
  if (!nombre.toLowerCase().endsWith(".md")) {
    return { ok: false as const, error: "formato" as const };
  }

  if (!validarArchivo(bytes, "text/plain").ok) {
    return { ok: false as const, error: "archivo" as const };
  }

  let texto: string;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false as const, error: "archivo" as const };
  }

  if (texto.trim().length < 20) {
    return { ok: false as const, error: "texto" as const };
  }

  return { ok: true as const, texto };
}

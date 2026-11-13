const MAXIMO = 10 * 1024 * 1024;

const firmas: Record<string, number[] | null> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "text/plain": null,
};

export function validarArchivo(bytes: Buffer, tipoDeclarado: string) {
  if (bytes.length === 0 || bytes.length > MAXIMO) {
    return { ok: false as const, error: "El archivo supera el tamaño permitido o está vacío." };
  }
  if (!(tipoDeclarado in firmas)) {
    return { ok: false as const, error: "Tipo de archivo no permitido." };
  }
  if (bytes.subarray(0, 2).toString("utf8") === "MZ") {
    return { ok: false as const, error: "El contenido no corresponde a un documento." };
  }
  const firma = firmas[tipoDeclarado];
  if (firma && !firma.every((byte, indice) => bytes[indice] === byte)) {
    return { ok: false as const, error: "El contenido no coincide con el tipo declarado." };
  }
  if (tipoDeclarado === "text/plain" && bytes.includes(0)) {
    return { ok: false as const, error: "El archivo de texto no es válido." };
  }
  return { ok: true as const };
}

export function claveAleatoria(prefijo: string) {
  return `${prefijo}/${crypto.randomUUID()}`;
}

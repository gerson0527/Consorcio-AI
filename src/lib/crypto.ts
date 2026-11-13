import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function hashDocumento(documento: string) {
  const digitos = documento.replace(/\D/g, "");
  return createHash("sha256").update(digitos).digest("hex");
}

export function cifrarCampo(texto: string, clave: Buffer) {
  if (clave.length !== 32) {
    throw new Error("La clave de cifrado debe medir 32 bytes");
  }
  const iv = randomBytes(12);
  const cifrador = createCipheriv("aes-256-gcm", clave, iv);
  const contenido = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return Buffer.concat([iv, etiqueta, contenido]).toString("base64");
}

export function descifrarCampo(paquete: string, clave: Buffer) {
  if (clave.length !== 32) {
    throw new Error("La clave de cifrado debe medir 32 bytes");
  }
  const datos = Buffer.from(paquete, "base64");
  const iv = datos.subarray(0, 12);
  const etiqueta = datos.subarray(12, 28);
  const contenido = datos.subarray(28);
  const descifrador = createDecipheriv("aes-256-gcm", clave, iv);
  descifrador.setAuthTag(etiqueta);
  return Buffer.concat([descifrador.update(contenido), descifrador.final()]).toString("utf8");
}

export function enmascararDocumento(documento: string) {
  const digitos = documento.replace(/\D/g, "");
  return `***${digitos.slice(-4)}`;
}

export function enmascararTextoParaIa(texto: string) {
  return texto.replace(/\d{5,}/g, "*****");
}

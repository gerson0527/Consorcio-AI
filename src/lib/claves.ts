import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashClave(clave: string) {
  const sal = randomBytes(16).toString("base64url");
  const derivado = (await scryptAsync(clave, sal, 32)) as Buffer;
  return `scrypt$${sal}$${derivado.toString("base64url")}`;
}

export async function verificarClave(clave: string, almacenada: string) {
  const [, sal, esperado] = almacenada.split("$");
  if (!sal || !esperado) return false;
  const derivado = (await scryptAsync(clave, sal, 32)) as Buffer;
  const real = Buffer.from(esperado, "base64url");
  if (real.length !== derivado.length) return false;
  return timingSafeEqual(real, derivado);
}

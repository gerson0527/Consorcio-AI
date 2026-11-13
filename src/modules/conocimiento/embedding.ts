import { DIMENSION_EMBEDDING } from "@/modules/conocimiento/constantes";

const vacias = new Set(["de", "la", "el", "los", "las", "se", "es", "en", "y", "a", "del", "por", "con", "un", "una", "que", "al"]);

export function tokenizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !vacias.has(token));
}

function fnv(texto: string) {
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function embeddingLocal(texto: string) {
  const vector = Array.from({ length: DIMENSION_EMBEDDING }, () => 0);
  for (const token of tokenizar(texto)) {
    const hash = fnv(token);
    const indice = hash % DIMENSION_EMBEDDING;
    vector[indice] += hash % 2 === 0 ? 1 : -1;
  }
  const norma = Math.sqrt(vector.reduce((suma, valor) => suma + valor * valor, 0));
  if (norma === 0) return vector;
  return vector.map((valor) => valor / norma);
}

export function similitudCoseno(izquierda: number[], derecha: number[]) {
  let producto = 0;
  let normaIzquierda = 0;
  let normaDerecha = 0;
  const limite = Math.min(izquierda.length, derecha.length);
  for (let i = 0; i < limite; i += 1) {
    producto += izquierda[i]! * derecha[i]!;
    normaIzquierda += izquierda[i]! ** 2;
    normaDerecha += derecha[i]! ** 2;
  }
  if (normaIzquierda === 0 || normaDerecha === 0) return 0;
  return producto / Math.sqrt(normaIzquierda * normaDerecha);
}

export function vectorSql(vector: number[]) {
  if (vector.length !== DIMENSION_EMBEDDING || vector.some((valor) => !Number.isFinite(valor))) {
    throw new Error("El embedding no tiene la dimensión configurada");
  }
  return `[${vector.join(",")}]`;
}

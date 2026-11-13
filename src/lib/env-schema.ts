import { z } from "zod";

function vacioAIndefinido(valor: unknown) {
  if (typeof valor === "string" && valor.trim() === "") {
    return undefined;
  }
  return valor;
}

function esClaveAes256(valor: string) {
  const normalizado = valor.replace(/\s/g, "");
  const bytes = Buffer.from(normalizado, "base64");
  if (bytes.length !== 32) {
    return false;
  }
  return bytes.toString("base64").replace(/=+$/, "") === normalizado.replace(/=+$/, "");
}

export const esquemaEntorno = z.object({
  NODE_ENV: z.preprocess(
    vacioAIndefinido,
    z.enum(["development", "test", "production"]).default("development"),
  ),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.preprocess(vacioAIndefinido, z.url().optional()),
  UPSTASH_REDIS_REST_URL: z.preprocess(vacioAIndefinido, z.url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(vacioAIndefinido, z.string().min(1).optional()),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET debe tener al menos 32 caracteres"),
  APP_URL: z.url("APP_URL debe ser una URL válida"),
  S3_ENDPOINT: z.url("S3_ENDPOINT debe ser una URL válida"),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  FIELD_ENCRYPTION_KEY: z
    .string()
    .refine(esClaveAes256, "FIELD_ENCRYPTION_KEY debe ser 32 bytes en base64"),
  ANTHROPIC_API_KEY: z.preprocess(vacioAIndefinido, z.string().default("")),
  EMBEDDINGS_PROVIDER: z.preprocess(
    vacioAIndefinido,
    z.string().min(1).default("pendiente"),
  ),
  EMBEDDINGS_API_KEY: z.preprocess(vacioAIndefinido, z.string().default("")),
  EMBEDDINGS_DIMENSIONS: z.preprocess(
    vacioAIndefinido,
    z.coerce.number().int().positive().optional(),
  ),
  CALIBRACION_MIN_MUESTRAS: z.preprocess(
    vacioAIndefinido,
    z.coerce.number().int().positive().default(30),
  ),
  REGLA_SUGERIDA_MIN_SOPORTE: z.preprocess(
    vacioAIndefinido,
    z.coerce.number().int().positive().default(10),
  ),
  REGLA_SUGERIDA_MIN_PRECISION: z.preprocess(
    vacioAIndefinido,
    z.coerce.number().gt(0).max(1).default(0.9),
  ),
});

export type Entorno = z.infer<typeof esquemaEntorno>;

export function analizarEntorno(origen: Record<string, string | undefined>): Entorno {
  const resultado = esquemaEntorno.safeParse(origen);
  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((issue) => `${issue.path.join(".") || "entorno"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variables de entorno inválidas:\n${detalle}`);
  }
  return resultado.data;
}

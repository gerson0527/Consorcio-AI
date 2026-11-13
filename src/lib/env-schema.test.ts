import { describe, expect, it } from "vitest";

import { analizarEntorno } from "@/lib/env-schema";

const claveValida = Buffer.alloc(32, 7).toString("base64");

function entornoValido(parcial: Record<string, string | undefined> = {}) {
  return {
    DATABASE_URL: "postgresql://consorcio:consorcio@localhost:5432/consorcio",
    REDIS_URL: "redis://localhost:6379",
    AUTH_SECRET: "x".repeat(32),
    APP_URL: "http://localhost:3000",
    S3_ENDPOINT: "http://localhost:9000",
    S3_REGION: "us-east-1",
    S3_BUCKET: "consorcio-documentos",
    S3_ACCESS_KEY: "consorcio",
    S3_SECRET_KEY: "secreto-local",
    FIELD_ENCRYPTION_KEY: claveValida,
    ANTHROPIC_API_KEY: "",
    EMBEDDINGS_PROVIDER: "",
    EMBEDDINGS_API_KEY: "",
    EMBEDDINGS_DIMENSIONS: "",
    CALIBRACION_MIN_MUESTRAS: "",
    REGLA_SUGERIDA_MIN_SOPORTE: "",
    REGLA_SUGERIDA_MIN_PRECISION: "",
    ...parcial,
  };
}

describe("analizarEntorno", () => {
  it("acepta el entorno de desarrollo y aplica los valores por defecto", () => {
    const entorno = analizarEntorno(entornoValido());

    expect(entorno.EMBEDDINGS_PROVIDER).toBe("pendiente");
    expect(entorno.ANTHROPIC_API_KEY).toBe("");
    expect(entorno.EMBEDDINGS_DIMENSIONS).toBeUndefined();
    expect(entorno.CALIBRACION_MIN_MUESTRAS).toBe(30);
    expect(entorno.REGLA_SUGERIDA_MIN_SOPORTE).toBe(10);
    expect(entorno.REGLA_SUGERIDA_MIN_PRECISION).toBe(0.9);
  });

  it("rechaza una clave de cifrado que no mide 32 bytes", () => {
    expect(() =>
      analizarEntorno(
        entornoValido({
          FIELD_ENCRYPTION_KEY: Buffer.alloc(16, 1).toString("base64"),
        }),
      ),
    ).toThrow(/FIELD_ENCRYPTION_KEY/);
  });

  it("rechaza AUTH_SECRET corto", () => {
    expect(() => analizarEntorno(entornoValido({ AUTH_SECRET: "corta" }))).toThrow(
      /AUTH_SECRET/,
    );
  });
});

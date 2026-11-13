import { describe, expect, it } from "vitest";

import { validarArchivo } from "@/modules/ingesta/archivos";
import { extraerSintetico, debeRevisar } from "@/modules/ingesta/extraer";
import { consolidarPerfil, esquemaPerfil } from "@/modules/ingesta/perfil";

describe("perfil", () => {
  it("trata un perfil vacío como datos aún no disponibles", () => {
    expect(esquemaPerfil.parse({})).toEqual({
      ingresoMensual: null,
      antiguedadLaboralMeses: null,
      empleador: null,
      edad: null,
      tipoContrato: null,
      obligacionesMensuales: null,
      confianza: {},
      revisar: [],
    });
  });
});

describe("extracción sintética", () => {
  it("lee un desprendible de ejemplo y marca revisión si falta un campo", () => {
    const completo = extraerSintetico(`tipo: desprendible
empleador: Ejemplo SAS
periodo: 2026-10
salarioBasico: 2500000
totalDevengado: 2800000
totalDeducciones: 300000
numero: 1234567890`);
    expect(completo.tipo).toBe("desprendible");
    if (completo.tipo !== "desprendible") return;
    expect(completo.campos.totalDevengado.valor).toBe(2_800_000);
    expect(debeRevisar(completo)).toBe(false);
    expect(completo.observaciones.join(" ")).toMatch(/omitió/i);

    const incompleto = extraerSintetico("tipo: desprendible\nempleador: Ejemplo SAS\n");
    expect(debeRevisar(incompleto)).toBe(true);
  });

  it("marca contradicción de empleador entre documentos", () => {
    const perfil = consolidarPerfil(
      [
        {
          tipo: "desprendible",
          estado: "PROCESADO",
          datos: extraerSintetico(`tipo: desprendible
empleador: Ejemplo SAS
periodo: 2026-10
salarioBasico: 2500000
totalDevengado: 2800000
totalDeducciones: 300000`),
        },
        {
          tipo: "certificado_laboral",
          estado: "PROCESADO",
          datos: extraerSintetico(`tipo: certificado_laboral
empleador: Otra Empresa
cargo: Analista
fechaIngreso: 2024-01-15
tipoContrato: FIJO`),
        },
      ],
      new Date("2026-11-12T00:00:00Z"),
    );
    expect(perfil.revisar).toContain("empleador");
    expect(perfil.antiguedadLaboralMeses).toBeGreaterThan(12);
  });
});

describe("archivos", () => {
  it("rechaza un ejecutable y un pdf que no lo es", () => {
    expect(validarArchivo(Buffer.from("MZ ejecutable"), "application/pdf").ok).toBe(false);
    expect(validarArchivo(Buffer.from("%PDF-1.4 ejemplo"), "application/pdf").ok).toBe(true);
    expect(validarArchivo(Buffer.alloc(0), "text/plain").ok).toBe(false);
  });
});

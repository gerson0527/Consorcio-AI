import { describe, expect, it } from "vitest";

import { calibrar } from "@/modules/aprendizaje/calibrar";
import { sugerirUmbral } from "@/modules/aprendizaje/patrones";

describe("calibración", () => {
  it("oculta la probabilidad por debajo del mínimo de muestras", () => {
    const pocas = calibrar(
      Array.from({ length: 10 }, () => ({ predicha: 0.8, aprobado: true })),
      30,
    );
    expect(pocas.probabilidad).toBeNull();
    const suficientes = calibrar(
      Array.from({ length: 30 }, (_, indice) => ({ predicha: 0.5, aprobado: indice < 15 })),
      30,
    );
    expect(suficientes.probabilidad).toBe(0.5);
    expect(suficientes.aprobacionReal).toBe(0.5);
  });
});

describe("patrones", () => {
  it("propone el umbral conocido y no activa la regla por sí mismo", () => {
    const casos = [
      ...Array.from({ length: 12 }, (_, indice) => ({
        id: `r${indice}`,
        valor: 6,
        rechazado: true,
        fecha: "2026-01-01",
      })),
      ...Array.from({ length: 12 }, (_, indice) => ({
        id: `a${indice}`,
        valor: 24,
        rechazado: false,
        fecha: "2026-06-01",
      })),
    ];
    const patron = sugerirUmbral("antiguedadLaboralMeses", casos, 10, 0.9);
    expect(patron).toMatchObject({ campo: "antiguedadLaboralMeses", operador: ">=", valor: 24 });
    expect(sugerirUmbral("antiguedadLaboralMeses", casos.slice(0, 3), 10, 0.9)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { esquemaRegla, evaluarRegla, evaluarReglas } from "@/modules/reglas/motor";

describe("operadores del motor de reglas", () => {
  it("evalúa >=", () => {
    expect(evaluarRegla(10, ">=", 10).resultado).toBe("cumple");
    expect(evaluarRegla(9, ">=", 10).resultado).toBe("no_cumple");
    expect(evaluarRegla(null, ">=", 10).resultado).toBe("faltante");
    expect(evaluarRegla("10", ">=", 10).mensaje).toMatch(/tipo/i);
  });

  it("evalúa <=", () => {
    expect(evaluarRegla(70, "<=", 70).resultado).toBe("cumple");
    expect(evaluarRegla(71, "<=", 70).resultado).toBe("no_cumple");
  });

  it("evalúa ==", () => {
    expect(evaluarRegla("INDEFINIDO", "==", "INDEFINIDO").resultado).toBe("cumple");
    expect(evaluarRegla("FIJO", "==", "INDEFINIDO").resultado).toBe("no_cumple");
  });

  it("evalúa in", () => {
    expect(evaluarRegla("FIJO", "in", ["FIJO", "OBRA"]).resultado).toBe("cumple");
    expect(evaluarRegla("TEMPORAL", "in", ["FIJO"]).resultado).toBe("no_cumple");
  });

  it("evalúa between", () => {
    expect(evaluarRegla(30, "between", [18, 70]).resultado).toBe("cumple");
    expect(evaluarRegla(17, "between", [18, 70]).resultado).toBe("no_cumple");
    expect(evaluarRegla(71, "between", [18, 70]).resultado).toBe("no_cumple");
  });
});

describe("detalle de reglas", () => {
  it("arma reglasDetalle y no trata un faltante como rechazo", () => {
    const resultado = evaluarReglas(
      { ingresoMensual: 1_000_000 },
      [
        {
          id: "r1",
          campo: "ingresoMensual",
          operador: ">=",
          valor: 2_000_000,
          mensaje: "Ingreso insuficiente",
        },
        {
          id: "r2",
          campo: "edad",
          operador: ">=",
          valor: 18,
          mensaje: "Edad mínima",
        },
      ],
    );
    expect(resultado.cumpleReglas).toBe(false);
    expect(resultado.faltantes).toEqual(["edad"]);
    expect(resultado.reglasDetalle[0]).toMatchObject({
      reglaId: "r1",
      resultado: "no_cumple",
      valorLeido: 1_000_000,
    });
  });

  it("rechaza un operador inyectado", () => {
    expect(
      esquemaRegla.safeParse({
        campo: "edad",
        operador: "drop table",
        valor: 1,
        mensaje: "No debe pasar",
        tipoCredito: null,
      }).success,
    ).toBe(false);
  });
});

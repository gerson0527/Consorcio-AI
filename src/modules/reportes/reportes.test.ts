import { describe, expect, it } from "vitest";

import { aCsv, parsearCsvResultados } from "@/modules/reportes/csv";
import { resumirReporte } from "@/modules/reportes/resumen";

describe("reportes", () => {
  it("hace coincidir el resumen con el conteo de las filas", () => {
    const resumen = resumirReporte([
      {
        casoId: "c1",
        entidad: "Banco Ejemplo",
        veredicto: "FAVORABLE",
        resultado: "APROBADO",
        motivo: null,
        creadoEn: new Date("2026-01-01T00:00:00Z"),
        resultadoEn: new Date("2026-01-02T00:00:00Z"),
      },
      {
        casoId: "c2",
        entidad: "Banco Ejemplo",
        veredicto: "DESFAVORABLE",
        resultado: "RECHAZADO",
        motivo: "Ingreso",
        creadoEn: new Date("2026-01-01T00:00:00Z"),
        resultadoEn: new Date("2026-01-03T00:00:00Z"),
      },
    ]);
    expect(resumen.casos).toBe(2);
    expect(resumen.tasaPorEntidad[0]).toMatchObject({
      evaluaciones: 2,
      tasaAprobacion: 0.5,
    });
    expect(resumen.coincidencia).toBe(1);
    expect(resumen.motivos).toEqual([{ motivo: "Ingreso", cantidad: 1 }]);
  });

  it("rechaza filas inválidas y conserva el número de línea", () => {
    const resultado = parsearCsvResultados(
      "documentoHash,entidad,estado,motivo\nabc,Banco,QUIZAS,motivo\n",
    );
    expect(resultado.validas).toHaveLength(0);
    expect(resultado.errores[0]).toMatchObject({ linea: 2 });
  });

  it("neutraliza celdas que podrían ejecutarse como fórmulas en una hoja de cálculo", () => {
    expect(aCsv([["=1+1", " texto", "+SUMA(A1:A2)", "-1", "@cmd"]])).toBe(
      `"'=1+1"," texto","'+SUMA(A1:A2)","'-1","'@cmd"`,
    );
  });
});

import { describe, expect, it } from "vitest";

import { analizarConFragmentos, validarCitas } from "@/modules/evaluacion/analizar";
import { ordenarRanking } from "@/modules/evaluacion/ranking";

describe("análisis y ranking", () => {
  it("no cita un fragmento que no existe y declara insuficiente sin evidencia", () => {
    const analisis = analizarConFragmentos({
      entidadId: "e1",
      fragmentos: [],
      detalles: [],
      faltantesDocumento: ["extracto"],
    });
    expect(analisis.veredicto).toBe("INSUFICIENTE");
    expect(validarCitas(analisis.citas, [])).toBe(false);
    expect(validarCitas([{ fragmentoId: "otro" }], [{ id: "f1" }])).toBe(false);
  });

  it("cita un fragmento existente y ordena primero a quien cumple", () => {
    const analisis = analizarConFragmentos({
      entidadId: "e1",
      fragmentos: [{ id: "f1", seccion: "Edad", pagina: 1, texto: "Edad mínima 18." }],
      detalles: [{ resultado: "cumple", campo: "edad", mensaje: "Cumple edad" }],
      faltantesDocumento: [],
    });
    expect(validarCitas(analisis.citas, [{ id: "f1" }])).toBe(true);
    const orden = ordenarRanking([
      {
        entidadId: "b",
        cumpleReglas: false,
        veredicto: "DESFAVORABLE" as const,
        probabilidad: 0.9,
        tieneCitas: true,
        faltanDatos: false,
        muestrasCalibracion: 40,
        minimoMuestras: 30,
      },
      {
        entidadId: "a",
        cumpleReglas: true,
        veredicto: "FAVORABLE" as const,
        probabilidad: 0.4,
        tieneCitas: true,
        faltanDatos: false,
        muestrasCalibracion: 10,
        minimoMuestras: 30,
      },
    ]);
    expect(orden[0]?.entidadId).toBe("a");
    expect(orden[0]?.probabilidad).toBeNull();
    expect(orden[0]?.confianza).toBe("MEDIA");
    expect(orden[1]?.ranking).toBe(2);
  });
});

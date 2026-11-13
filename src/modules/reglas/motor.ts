import { z } from "zod";

export const operadores = [">=", "<=", "==", "in", "between"] as const;
export type Operador = (typeof operadores)[number];

export const esquemaRegla = z
  .object({
    campo: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
    operador: z.enum(operadores),
    valor: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number()])),
    ]),
    mensaje: z.string().trim().min(3).max(400),
    tipoCredito: z.enum(["LIBRANZA", "VEHICULO", "VIVIENDA", "CONSUMO"]).nullable(),
  })
  .superRefine((regla, contexto) => {
    if (!valorValido(regla.operador, regla.valor)) {
      contexto.addIssue({
        code: "custom",
        path: ["valor"],
        message: "El valor no corresponde al operador",
      });
    }
  });

function valorValido(operador: Operador, valor: unknown) {
  if (operador === "between") {
    return (
      Array.isArray(valor) &&
      valor.length === 2 &&
      valor.every((item) => typeof item === "number")
    );
  }
  if (operador === "in") {
    return Array.isArray(valor) && valor.length > 0;
  }
  return typeof valor === "number" || typeof valor === "string" || typeof valor === "boolean";
}

export type ResultadoRegla = "cumple" | "no_cumple" | "faltante";

export type DetalleRegla = {
  reglaId: string;
  campo: string;
  operador: Operador;
  esperado: unknown;
  valorLeido: unknown;
  resultado: ResultadoRegla;
  mensaje: string;
};

export function evaluarRegla(
  valorLeido: unknown,
  operador: Operador,
  esperado: unknown,
): { resultado: ResultadoRegla; mensaje?: string } {
  if (valorLeido === null || valorLeido === undefined || valorLeido === "") {
    return { resultado: "faltante" };
  }
  if (operador === ">=" || operador === "<=") {
    if (typeof valorLeido !== "number" || typeof esperado !== "number") {
      return { resultado: "no_cumple", mensaje: "El dato no tiene el tipo que exige la regla." };
    }
    const cumple = operador === ">=" ? valorLeido >= esperado : valorLeido <= esperado;
    return { resultado: cumple ? "cumple" : "no_cumple" };
  }
  if (operador === "==") {
    return { resultado: Object.is(valorLeido, esperado) ? "cumple" : "no_cumple" };
  }
  if (operador === "in") {
    if (!Array.isArray(esperado)) {
      return { resultado: "no_cumple", mensaje: "El dato no tiene el tipo que exige la regla." };
    }
    return { resultado: esperado.includes(valorLeido) ? "cumple" : "no_cumple" };
  }
  if (!Array.isArray(esperado) || esperado.length !== 2 || typeof valorLeido !== "number") {
    return { resultado: "no_cumple", mensaje: "El dato no tiene el tipo que exige la regla." };
  }
  const [minimo, maximo] = esperado as [number, number];
  return {
    resultado: valorLeido >= minimo && valorLeido <= maximo ? "cumple" : "no_cumple",
  };
}

export function evaluarReglas(
  perfil: Record<string, unknown>,
  reglas: Array<{
    id: string;
    campo: string;
    operador: Operador;
    valor: unknown;
    mensaje: string;
  }>,
) {
  const reglasDetalle: DetalleRegla[] = reglas.map((regla) => {
    const evaluacion = evaluarRegla(perfil[regla.campo], regla.operador, regla.valor);
    return {
      reglaId: regla.id,
      campo: regla.campo,
      operador: regla.operador,
      esperado: regla.valor,
      valorLeido: perfil[regla.campo] ?? null,
      resultado: evaluacion.resultado,
      mensaje: evaluacion.mensaje ?? regla.mensaje,
    };
  });
  return {
    reglasDetalle,
    cumpleReglas: reglasDetalle.every((detalle) => detalle.resultado !== "no_cumple"),
    faltantes: reglasDetalle
      .filter((detalle) => detalle.resultado === "faltante")
      .map((detalle) => detalle.campo),
  };
}

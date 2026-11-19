import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parsearRespuestaJson, RespuestaJsonInvalidaError } from "@/lib/claude";

const esquema = z.object({ reglas: z.array(z.string()) });

describe("respuestas JSON de la IA", () => {
  it("parsea respuestas válidas con el esquema indicado", () => {
    expect(
      parsearRespuestaJson('{"reglas":["edad >= 18"]}', "end_turn", esquema),
    ).toEqual({
      reglas: ["edad >= 18"],
    });
  });

  it("identifica respuestas vacías o truncadas para poder reintentarlas", () => {
    expect(() => parsearRespuestaJson("", "end_turn", esquema)).toThrow(
      RespuestaJsonInvalidaError,
    );
    expect(() => parsearRespuestaJson('{"reglas":', "end_turn", esquema)).toThrow(
      RespuestaJsonInvalidaError,
    );
    expect(() => parsearRespuestaJson('{"reglas":[]}', "max_tokens", esquema)).toThrow(
      /truncada/i,
    );
  });
});

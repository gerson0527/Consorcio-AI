import { describe, expect, it } from "vitest";

import {
  citaVerificable,
  dividirMarkdownPolitica,
  extraerRangoGeneralEdad,
  validarPropuestasPolitica,
  type PropuestaReglaPolitica,
} from "@/modules/reglas/politica";
import { fragmentarPolitica } from "@/modules/conocimiento/fragmentar";

const cita = "El solicitante debe acreditar ingresos mensuales superiores a $2.000.000.";
const propuesta: PropuestaReglaPolitica = {
  campo: "ingresoMensual",
  operador: ">=",
  valor: 2_000_000,
  mensaje: "Ingreso mensual mínimo según política.",
  tipoCredito: null,
  seccion: "Ingresos",
  cita,
};

describe("reglas sugeridas desde políticas", () => {
  it("divide documentos grandes en partes con límite y conserva su contenido", () => {
    const markdown = [
      "# Política",
      "## Ingresos\nCriterio explícito de ingresos.",
      `## Tabla\n| Encabezado | Valor |\n|---|---|\n${Array.from(
        { length: 20 },
        (_, indice) => `| Fila ${indice} | ${"dato ".repeat(8)} |`,
      ).join("\n")}`,
      "## Edad\nCriterio de edad.",
    ].join("\n\n");
    const partes = dividirMarkdownPolitica(markdown, 180);
    expect(partes.length).toBeGreaterThan(1);
    expect(partes.every((parte) => parte.length <= 180)).toBe(true);
    for (const contenido of [
      "# Política",
      "Criterio explícito de ingresos.",
      "| Fila 19 |",
      "Criterio de edad.",
    ]) {
      expect(partes.join("\n")).toContain(contenido);
    }
  });

  it("acepta una regla compatible que incluye una cita literal", () => {
    expect(validarPropuestasPolitica([propuesta], `## Ingresos\n${cita}`)).toEqual([
      propuesta,
    ]);
  });

  it("permite variaciones de espacios al comprobar una cita", () => {
    expect(
      citaVerificable(
        `La política dice: ${cita}`,
        cita.replace("ingresos mensuales", "ingresos\nmensuales"),
      ),
    ).toBe(true);
  });

  it("rechaza citas no verificables, campos no soportados y operadores incompatibles", () => {
    const noCitada = { ...propuesta, cita: "La política exige un puntaje mínimo." };
    const campoDesconocido = { ...propuesta, campo: "puntaje" };
    const operadorTextoEnNumero = {
      ...propuesta,
      operador: "in" as const,
      valor: [1_000_000],
    };
    expect(
      validarPropuestasPolitica(
        [noCitada, campoDesconocido, operadorTextoEnNumero],
        cita,
      ),
    ).toEqual([]);
  });

  it("elimina propuestas duplicadas", () => {
    expect(validarPropuestasPolitica([propuesta, propuesta], cita)).toEqual([propuesta]);
  });

  it("colapsa tramos contiguos de edad en una sola regla general verificable", () => {
    const markdown = `## Montos por edad
| Edad del cliente | Monto máximo |
|---|---|
| 18 a 70 años | Hasta $130 MM |
| 71 a 80 años | Hasta $80 MM |
| 81 a 85 años | Hasta $17,5 MM |
| 86 a 88 años | Hasta $5,2 MM |`;
    const rango = extraerRangoGeneralEdad(markdown);
    expect(rango).toMatchObject({
      campo: "edad",
      operador: "between",
      valor: [18, 88],
      seccion: "Montos por edad",
    });
    expect(rango && validarPropuestasPolitica([rango], markdown)).toEqual([rango]);
  });

  it("no colapsa tramos de edad con brechas", () => {
    const markdown = `| Edad del cliente | Monto máximo |
|---|---|
| 18 a 70 años | Hasta $130 MM |
| 72 a 80 años | Hasta $80 MM |`;
    expect(extraerRangoGeneralEdad(markdown)).toBeNull();
  });

  it("detecta el rango de edad del Markdown de Credialianza", () => {
    const markdown = `# Política Credialianza
## 2. Condiciones generales
### 2.1 Montos por edad
| Edad del cliente | Monto máximo |
|---|---|
| 18 a 70 años | Hasta $130 MM |
| 71 a 80 años | Hasta $80 MM |
| 81 a 85 años | Hasta $17,5 MM |
| 86 a 88 años | Hasta $5,2 MM |

${"Contenido complementario. ".repeat(300)}`;
    const partes = dividirMarkdownPolitica(markdown);
    expect(partes.length).toBeGreaterThan(1);
    expect(partes.every((parte) => parte.length <= 4_500)).toBe(true);
    const rango = extraerRangoGeneralEdad(markdown);
    expect(rango).toMatchObject({
      campo: "edad",
      operador: "between",
      valor: [18, 88],
      seccion: "2.1 Montos por edad",
    });
    expect(rango && validarPropuestasPolitica([rango], markdown)).toEqual([rango]);

    const reconstruido = fragmentarPolitica(markdown)
      .map(
        (fragmento) =>
          `${fragmento.seccion ? `## ${fragmento.seccion}\n` : ""}${fragmento.texto}`,
      )
      .join("\n\n");
    expect(extraerRangoGeneralEdad(reconstruido)).toMatchObject({
      campo: "edad",
      operador: "between",
      valor: [18, 88],
    });
    expect(
      dividirMarkdownPolitica(reconstruido).every((parte) => parte.length <= 4_500),
    ).toBe(true);
  });
});

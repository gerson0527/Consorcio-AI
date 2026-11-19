import { z } from "zod";

import { esquemaRegla } from "@/modules/reglas/motor";

const esquemaPropuesta = z
  .object({
    campo: z.string().min(1).max(80),
    operador: z.enum([">=", "<=", "==", "in", "between"]),
    valor: z.union([
      z.string(),
      z.number().finite(),
      z
        .array(z.union([z.string(), z.number().finite()]))
        .min(1)
        .max(10),
    ]),
    mensaje: z.string().trim().min(3).max(400),
    tipoCredito: z.enum(["LIBRANZA", "VEHICULO", "VIVIENDA", "CONSUMO"]).nullable(),
    seccion: z.string().trim().min(1).max(120).nullable(),
    cita: z.string().trim().min(8).max(500),
  })
  .strict();

export const esquemaPropuestasPolitica = z
  .object({ reglas: z.array(esquemaPropuesta).max(5) })
  .strict();

export type PropuestaReglaPolitica = z.infer<typeof esquemaPropuesta>;

export function dividirMarkdownPolitica(markdown: string, maxCaracteres = 4_500) {
  const bloques = markdown
    .split(/\n\s*\n/)
    .map((bloque) => bloque.trim())
    .filter(Boolean);
  const unidades = bloques.flatMap((bloque) =>
    bloque.length > maxCaracteres ? dividirBloqueLargo(bloque, maxCaracteres) : [bloque],
  );
  const partes: string[] = [];
  let actual = "";

  for (const unidad of unidades) {
    const candidato = actual ? `${actual}\n\n${unidad}` : unidad;
    if (candidato.length > maxCaracteres && actual) {
      partes.push(actual);
      actual = unidad;
    } else {
      actual = candidato;
    }
  }
  if (actual) partes.push(actual);
  return partes;
}

export function extraerRangoGeneralEdad(markdown: string): PropuestaReglaPolitica | null {
  const lineas = markdown.split(/\r?\n/);
  for (let indice = 0; indice < lineas.length; indice += 1) {
    if (!/^\|\s*edad del cliente\s*\|.*monto máximo/i.test(lineas[indice])) continue;
    if (!/^\|\s*:?-{3,}/.test(lineas[indice + 1] ?? "")) continue;

    const filas = [lineas[indice], lineas[indice + 1]];
    const rangos: Array<{ desde: number; hasta: number }> = [];
    for (
      let fila = indice + 2;
      fila < lineas.length && /^\s*\|/.test(lineas[fila]);
      fila += 1
    ) {
      const celdas = lineas[fila]
        .split("|")
        .slice(1, -1)
        .map((celda) => celda.trim());
      const rango = celdas[0]?.match(/^(\d+)\s*(?:a|al|-|–)\s*(\d+)(?:\s+años?)?$/i);
      if (!rango || !/(?:\$|MM)/i.test(celdas[1] ?? "")) break;
      rangos.push({ desde: Number(rango[1]), hasta: Number(rango[2]) });
      filas.push(lineas[fila]);
    }

    rangos.sort((a, b) => a.desde - b.desde);
    if (rangos.length < 2 || rangos.some((rango) => rango.desde > rango.hasta)) continue;
    if (
      rangos.some(
        (rango, posicion) =>
          posicion > 0 && rango.desde !== rangos[posicion - 1].hasta + 1,
      )
    ) {
      continue;
    }

    const seccion = lineas
      .slice(0, indice)
      .reverse()
      .find((linea) => /^#{1,4}\s+/.test(linea))
      ?.replace(/^#{1,4}\s+/, "")
      .trim();
    const cita = filas.join("\n");
    if (cita.length > 500) continue;

    // Los tramos son alternativas; el motor combina reglas mediante AND.
    return {
      campo: "edad",
      operador: "between",
      valor: [rangos[0].desde, rangos[rangos.length - 1].hasta],
      mensaje: `Rango general de edad: ${rangos[0].desde} a ${rangos[rangos.length - 1].hasta} años. Los topes de monto por tramo requieren verificar el monto solicitado.`,
      tipoCredito: null,
      seccion: seccion ?? null,
      cita,
    };
  }
  return null;
}

function dividirBloqueLargo(bloque: string, maxCaracteres: number) {
  const lineas = bloque.split(/\r?\n/);
  const esTabla =
    lineas.length > 2 && /^\s*\|/.test(lineas[0]) && /^\s*\|\s*:?-{3,}/.test(lineas[1]);
  const encabezadoTabla = esTabla ? lineas.slice(0, 2).join("\n") : "";
  const contenido = esTabla ? lineas.slice(2) : lineas;
  const partes: string[] = [];
  let actual = encabezadoTabla;
  const maxLinea = Math.max(
    1,
    maxCaracteres - (encabezadoTabla ? encabezadoTabla.length + 1 : 0),
  );

  for (const linea of contenido) {
    const segmentos =
      linea.length > maxLinea
        ? (linea.match(new RegExp(`.{1,${maxLinea}}`, "g")) ?? [linea])
        : [linea];
    for (const segmento of segmentos) {
      const candidato = actual ? `${actual}\n${segmento}` : segmento;
      if (candidato.length > maxCaracteres) {
        if (actual && actual !== encabezadoTabla) partes.push(actual);
        actual = encabezadoTabla ? `${encabezadoTabla}\n${segmento}` : segmento;
      } else {
        actual = candidato;
      }
    }
  }
  if (actual && actual !== encabezadoTabla) partes.push(actual);
  return partes;
}

const camposNumericos = new Set([
  "ingresoMensual",
  "antiguedadLaboralMeses",
  "edad",
  "obligacionesMensuales",
]);
const camposTexto = new Set(["empleador", "tipoContrato"]);

export function validarPropuestasPolitica(
  propuestas: PropuestaReglaPolitica[],
  markdown: string,
) {
  const firmas = new Set<string>();
  return propuestas.filter((propuesta) => {
    if (!citaVerificable(markdown, propuesta.cita)) return false;
    if (!campoYValorCompatibles(propuesta)) return false;
    const regla = {
      campo: propuesta.campo,
      operador: propuesta.operador,
      valor: propuesta.valor,
      mensaje: propuesta.mensaje,
      tipoCredito: propuesta.tipoCredito,
    };
    if (!esquemaRegla.safeParse(regla).success) return false;
    const firma = firmaRegla(regla);
    if (firmas.has(firma)) return false;
    firmas.add(firma);
    return true;
  });
}

export function citaVerificable(markdown: string, cita: string) {
  const normalizar = (texto: string) =>
    texto.normalize("NFC").replace(/\s+/g, " ").trim();
  return normalizar(markdown).includes(normalizar(cita));
}

export function firmaRegla(regla: {
  campo: string;
  operador: string;
  valor: unknown;
  tipoCredito: string | null;
}) {
  return JSON.stringify([regla.campo, regla.operador, regla.valor, regla.tipoCredito]);
}

function campoYValorCompatibles(propuesta: PropuestaReglaPolitica) {
  if (camposNumericos.has(propuesta.campo)) {
    return (
      [">=", "<=", "==", "between"].includes(propuesta.operador) &&
      (typeof propuesta.valor === "number" ||
        (Array.isArray(propuesta.valor) &&
          propuesta.valor.length === 2 &&
          propuesta.valor.every((valor) => typeof valor === "number")))
    );
  }
  if (camposTexto.has(propuesta.campo)) {
    return (
      ["==", "in"].includes(propuesta.operador) &&
      (typeof propuesta.valor === "string" ||
        (Array.isArray(propuesta.valor) &&
          propuesta.valor.every((valor) => typeof valor === "string")))
    );
  }
  return false;
}

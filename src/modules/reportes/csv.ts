export type FilaCsv = {
  linea: number;
  documentoHash: string;
  entidad: string;
  estado: "APROBADO" | "RECHAZADO";
  motivo: string;
};

export type ErrorCsv = { linea: number; mensaje: string };

export function parsearCsvResultados(texto: string) {
  const filas = dividirCsv(texto).filter((fila) =>
    fila.some((celda) => celda.trim() !== ""),
  );
  const errores: ErrorCsv[] = [];
  const validas: FilaCsv[] = [];
  if (filas.length === 0) {
    return { validas, errores: [{ linea: 1, mensaje: "El archivo está vacío." }] };
  }
  const encabezado = filas[0]!.map((celda) => celda.trim());
  const esperadas = ["documentoHash", "entidad", "estado", "motivo"];
  if (esperadas.some((columna, indice) => encabezado[indice] !== columna)) {
    errores.push({
      linea: 1,
      mensaje: "El encabezado debe ser documentoHash,entidad,estado,motivo.",
    });
    return { validas, errores };
  }
  filas.slice(1).forEach((fila, indice) => {
    const linea = indice + 2;
    const [documentoHash, entidad, estado, motivo] = fila.map((celda) => celda.trim());
    if (!documentoHash || !entidad || !motivo) {
      errores.push({ linea, mensaje: "Faltan documento, entidad o motivo." });
      return;
    }
    if (estado !== "APROBADO" && estado !== "RECHAZADO") {
      errores.push({ linea, mensaje: "El estado debe ser APROBADO o RECHAZADO." });
      return;
    }
    validas.push({ linea, documentoHash, entidad, estado, motivo });
  });
  return { validas, errores };
}

function dividirCsv(texto: string) {
  return texto
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((linea) => {
      const celdas: string[] = [];
      let actual = "";
      let comillas = false;
      for (const caracter of linea) {
        if (caracter === '"') {
          comillas = !comillas;
          continue;
        }
        if (caracter === "," && !comillas) {
          celdas.push(actual);
          actual = "";
          continue;
        }
        actual += caracter;
      }
      celdas.push(actual);
      return celdas;
    });
}

export function aCsv(filas: string[][]) {
  return filas
    .map((fila) =>
      fila
        .map((celda) => {
          const segura = /^[\s]*[=+\-@]/u.test(celda) ? `'${celda}` : celda;
          return `"${segura.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");
}

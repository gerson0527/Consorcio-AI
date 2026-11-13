export type MuestraCalibracion = { predicha: number | null; aprobado: boolean };

export function calibrar(muestras: MuestraCalibracion[], minimo: number) {
  const reales = muestras.filter((muestra) => muestra.predicha !== null);
  const base = reales.length > 0 ? reales : muestras;
  const aprobacionReal = base.length
    ? base.filter((muestra) => muestra.aprobado).length / base.length
    : 0;
  const predichas = muestras
    .map((muestra) => muestra.predicha)
    .filter((valor): valor is number => valor !== null);
  const aprobacionPredicha = predichas.length
    ? predichas.reduce((suma, valor) => suma + valor, 0) / predichas.length
    : aprobacionReal;
  return {
    muestras: muestras.length,
    aprobacionPredicha,
    aprobacionReal,
    probabilidad: muestras.length >= minimo ? aprobacionReal : null,
    parametros: { minimo, suficientes: muestras.length >= minimo },
  };
}

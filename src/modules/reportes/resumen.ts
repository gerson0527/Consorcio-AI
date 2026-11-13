export type FilaReporte = {
  casoId: string;
  entidad: string;
  veredicto: string;
  resultado: "APROBADO" | "RECHAZADO" | null;
  motivo: string | null;
  creadoEn: Date;
  resultadoEn: Date | null;
};

export function resumirReporte(filas: FilaReporte[]) {
  const porEntidad = new Map<string, { total: number; aprobados: number }>();
  const motivos = new Map<string, number>();
  let aciertos = 0;
  let comparables = 0;
  let tiempo = 0;
  let tiempos = 0;
  for (const fila of filas) {
    const entidad = porEntidad.get(fila.entidad) ?? { total: 0, aprobados: 0 };
    entidad.total += 1;
    if (fila.resultado === "APROBADO") entidad.aprobados += 1;
    porEntidad.set(fila.entidad, entidad);
    if (fila.resultado === "RECHAZADO" && fila.motivo) {
      motivos.set(fila.motivo, (motivos.get(fila.motivo) ?? 0) + 1);
    }
    if (fila.resultado) {
      comparables += 1;
      const favorable = fila.veredicto === "FAVORABLE" || fila.veredicto === "CONDICIONADO";
      if ((favorable && fila.resultado === "APROBADO") || (!favorable && fila.resultado === "RECHAZADO")) {
        aciertos += 1;
      }
    }
    if (fila.resultadoEn) {
      tiempo += fila.resultadoEn.getTime() - fila.creadoEn.getTime();
      tiempos += 1;
    }
  }
  return {
    casos: new Set(filas.map((fila) => fila.casoId)).size,
    evaluaciones: filas.length,
    tasaPorEntidad: [...porEntidad.entries()].map(([entidad, datos]) => ({
      entidad,
      evaluaciones: datos.total,
      tasaAprobacion: datos.total ? datos.aprobados / datos.total : 0,
    })),
    aciertos,
    comparables,
    coincidencia: comparables ? aciertos / comparables : null,
    motivos: [...motivos.entries()].map(([motivo, cantidad]) => ({ motivo, cantidad })),
    tiempoPromedioMs: tiempos ? tiempo / tiempos : null,
  };
}

export type CasoPatron = { valor: number | null; rechazado: boolean; id: string; fecha: string };

export type Patron = {
  campo: string;
  operador: ">=";
  valor: number;
  soporte: number;
  precision: number;
  casos: string[];
  desde: string;
  hasta: string;
};

export function sugerirUmbral(
  campo: string,
  casos: CasoPatron[],
  minimoSoporte: number,
  minimaPrecision: number,
): Patron | null {
  const utiles = casos.filter((caso): caso is CasoPatron & { valor: number } => caso.valor !== null);
  const candidatos = [...new Set(utiles.map((caso) => caso.valor))].sort((a, b) => a - b);
  let mejor: Patron | null = null;
  for (const umbral of candidatos) {
    const debajo = utiles.filter((caso) => caso.valor < umbral);
    if (debajo.length < minimoSoporte) continue;
    const precision = debajo.filter((caso) => caso.rechazado).length / debajo.length;
    if (precision < minimaPrecision) continue;
    const fechas = debajo.map((caso) => caso.fecha).sort();
    const candidato: Patron = {
      campo,
      operador: ">=",
      valor: umbral,
      soporte: debajo.length,
      precision,
      casos: debajo.map((caso) => caso.id),
      desde: fechas[0]!,
      hasta: fechas.at(-1)!,
    };
    if (!mejor || candidato.precision > mejor.precision || (candidato.precision === mejor.precision && candidato.soporte > mejor.soporte)) {
      mejor = candidato;
    }
  }
  return mejor;
}

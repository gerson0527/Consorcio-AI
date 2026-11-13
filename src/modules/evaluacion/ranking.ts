export type Confianza = "ALTA" | "MEDIA" | "BAJA";

export type ItemRanking = {
  entidadId: string;
  cumpleReglas: boolean;
  veredicto: "FAVORABLE" | "CONDICIONADO" | "DESFAVORABLE" | "INSUFICIENTE";
  probabilidad: number | null;
  tieneCitas: boolean;
  faltanDatos: boolean;
  muestrasCalibracion: number;
  minimoMuestras: number;
};

const ordenVeredicto = {
  FAVORABLE: 0,
  CONDICIONADO: 1,
  DESFAVORABLE: 2,
  INSUFICIENTE: 3,
};

export function confianzaDe(item: ItemRanking): Confianza {
  if (item.faltanDatos || !item.tieneCitas || item.veredicto === "INSUFICIENTE") return "BAJA";
  if (item.muestrasCalibracion < item.minimoMuestras) return "MEDIA";
  return "ALTA";
}

export function ordenarRanking<T extends ItemRanking>(items: T[]) {
  return [...items]
    .sort((a, b) => {
      const reglas = Number(b.cumpleReglas) - Number(a.cumpleReglas);
      if (reglas !== 0) return reglas;
      const veredicto = ordenVeredicto[a.veredicto] - ordenVeredicto[b.veredicto];
      if (veredicto !== 0) return veredicto;
      return (b.probabilidad ?? -1) - (a.probabilidad ?? -1);
    })
    .map((item, indice) => ({
      ...item,
      ranking: indice + 1,
      confianza: confianzaDe(item),
      probabilidad: item.muestrasCalibracion >= item.minimoMuestras ? item.probabilidad : null,
    }));
}

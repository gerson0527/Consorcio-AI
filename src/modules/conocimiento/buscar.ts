import { UMBRAL_EVIDENCIA } from "@/modules/conocimiento/constantes";
import { embeddingLocal, similitudCoseno } from "@/modules/conocimiento/embedding";

export type FragmentoBuscable = {
  id: string;
  seccion: string | null;
  pagina: number | null;
  texto: string;
  embedding?: number[] | null;
};

export function buscarEnMemoria(pregunta: string, fragmentos: FragmentoBuscable[], limite = 4) {
  const consulta = embeddingLocal(pregunta);
  const ordenados = fragmentos
    .map((fragmento) => ({
      ...fragmento,
      similitud: similitudCoseno(consulta, fragmento.embedding ?? embeddingLocal(fragmento.texto)),
    }))
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, limite);
  if (ordenados.length === 0 || ordenados[0]!.similitud < UMBRAL_EVIDENCIA) {
    return [];
  }
  return ordenados;
}

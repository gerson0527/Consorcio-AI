export { DIMENSION_EMBEDDING, UMBRAL_EVIDENCIA } from "@/modules/conocimiento/constantes";
export { fragmentarPolitica } from "@/modules/conocimiento/fragmentar";
export {
  embeddingLocal,
  similitudCoseno,
  vectorSql,
} from "@/modules/conocimiento/embedding";
export { buscarEnMemoria } from "@/modules/conocimiento/buscar";
export { guardarPolitica } from "@/modules/conocimiento/persistir";
export { leerPoliticaMarkdown } from "@/modules/conocimiento/markdown";
export type { FragmentoBuscable } from "@/modules/conocimiento/buscar";
export type { FragmentoTexto } from "@/modules/conocimiento/fragmentar";

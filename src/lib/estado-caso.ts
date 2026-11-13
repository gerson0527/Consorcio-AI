export function estadoCaso(entrada: {
  documentos: string[];
  revisar: boolean;
  evaluaciones: number;
  conResultado: boolean;
}) {
  if (entrada.documentos.some((estado) => estado === "PENDIENTE" || estado === "PROCESANDO")) {
    return "Procesando";
  }
  if (
    entrada.revisar ||
    entrada.documentos.some((estado) => estado === "REVISAR" || estado === "ERROR")
  ) {
    return "Por revisar";
  }
  if (entrada.evaluaciones > 0 && !entrada.conResultado) return "Resultado pendiente";
  if (entrada.evaluaciones > 0) return "Evaluado";
  return "Por revisar";
}

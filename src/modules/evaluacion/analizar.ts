import { z } from "zod";

export const veredictos = ["FAVORABLE", "CONDICIONADO", "DESFAVORABLE", "INSUFICIENTE"] as const;

export const esquemaAnalisis = z.object({
  entidadId: z.string(),
  veredicto: z.enum(veredictos),
  explicacion: z.string().max(900),
  condiciones: z.array(z.string()),
  faltantes: z.array(z.string()),
  citas: z.array(
    z.object({
      fragmentoId: z.string(),
      seccion: z.string(),
      pagina: z.number().int().nonnegative(),
    }),
  ),
});

export type Analisis = z.infer<typeof esquemaAnalisis>;

export function validarCitas(
  citas: Array<{ fragmentoId: string }>,
  fragmentos: Array<{ id: string }>,
) {
  const ids = new Set(fragmentos.map((fragmento) => fragmento.id));
  return citas.length > 0 && citas.every((cita) => ids.has(cita.fragmentoId));
}

type Fragmento = { id: string; seccion: string | null; pagina: number | null; texto: string };
type Detalle = { resultado: string; campo: string; mensaje: string };

export function analizarConFragmentos(entrada: {
  entidadId: string;
  fragmentos: Fragmento[];
  detalles: Detalle[];
  faltantesDocumento: string[];
}): Analisis {
  const cita = entrada.fragmentos[0];
  const citas = cita
    ? [{ fragmentoId: cita.id, seccion: cita.seccion ?? "Sin sección", pagina: cita.pagina ?? 0 }]
    : [];
  const faltantesRegla = entrada.detalles
    .filter((detalle) => detalle.resultado === "faltante")
    .map((detalle) => detalle.campo);
  const rechazos = entrada.detalles.filter((detalle) => detalle.resultado === "no_cumple");
  const faltantes = [...entrada.faltantesDocumento, ...faltantesRegla];

  if (!cita) {
    return esquemaAnalisis.parse({
      entidadId: entrada.entidadId,
      veredicto: "INSUFICIENTE",
      explicacion: "No hay fragmentos de la política vigente para sostener una comparación.",
      condiciones: [],
      faltantes: faltantes.length > 0 ? faltantes : ["política vigente con texto utilizable"],
      citas: [],
    });
  }

  const explicacionBase = rechazos.length
    ? `La política citada en ${cita.seccion ?? "el fragmento"} no se cumple: ${rechazos.map((detalle) => detalle.mensaje).join(" ")}`
    : `El perfil se contrastó con ${cita.seccion ?? "la política"} (página ${cita.pagina ?? "s. n."}).`;

  const veredicto = rechazos.length
    ? "DESFAVORABLE"
    : faltantes.length
      ? "CONDICIONADO"
      : "FAVORABLE";

  return esquemaAnalisis.parse({
    entidadId: entrada.entidadId,
    veredicto,
    explicacion: explicacionBase.slice(0, 700),
    condiciones: faltantes,
    faltantes,
    citas,
  });
}

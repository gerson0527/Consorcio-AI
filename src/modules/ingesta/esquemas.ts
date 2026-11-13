import { z } from "zod";

const confianza = z.number().min(0).max(1);
const texto = z.object({ valor: z.string().nullable(), confianza });
const numero = z.object({ valor: z.number().nullable(), confianza });
const periodo = z.object({
  valor: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  confianza,
});

export const esquemaDesprendible = z.object({
  tipo: z.literal("desprendible"),
  campos: z.object({
    empleador: texto,
    periodo,
    salarioBasico: numero,
    totalDevengado: numero,
    totalDeducciones: numero,
  }),
  observaciones: z.array(z.string()),
});

export const esquemaCedula = z.object({
  tipo: z.literal("cedula"),
  campos: z.object({
    nombre: texto,
    fechaNacimiento: z.object({
      valor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      confianza,
    }),
  }),
  observaciones: z.array(z.string()),
});

export const esquemaCertificado = z.object({
  tipo: z.literal("certificado_laboral"),
  campos: z.object({
    empleador: texto,
    cargo: texto,
    fechaIngreso: z.object({
      valor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      confianza,
    }),
    tipoContrato: texto,
  }),
  observaciones: z.array(z.string()),
});

export const esquemaExtracto = z.object({
  tipo: z.literal("extracto"),
  campos: z.object({
    entidadFinanciera: texto,
    saldoPromedio: numero,
    obligacionesMensuales: numero,
  }),
  observaciones: z.array(z.string()),
});

export const esquemaOtro = z.object({
  tipo: z.literal("otro"),
  campos: z.object({}),
  observaciones: z.array(z.string()),
});

export const esquemasPorTipo = {
  desprendible: esquemaDesprendible,
  cedula: esquemaCedula,
  certificado_laboral: esquemaCertificado,
  extracto: esquemaExtracto,
  otro: esquemaOtro,
} as const;

export const tiposDocumento = Object.keys(esquemasPorTipo) as Array<keyof typeof esquemasPorTipo>;

export type Extraccion = z.infer<
  | typeof esquemaDesprendible
  | typeof esquemaCedula
  | typeof esquemaCertificado
  | typeof esquemaExtracto
  | typeof esquemaOtro
>;

export const UMBRAL_CONFIANZA = 0.8;

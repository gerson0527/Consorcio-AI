import { z } from "zod";

import { UMBRAL_CONFIANZA, type Extraccion } from "@/modules/ingesta/esquemas";

export const esquemaPerfil = z.object({
  ingresoMensual: z.number().nullable().default(null),
  antiguedadLaboralMeses: z.number().nullable().default(null),
  empleador: z.string().nullable().default(null),
  edad: z.number().nullable().default(null),
  tipoContrato: z.string().nullable().default(null),
  obligacionesMensuales: z.number().nullable().default(null),
  confianza: z.record(z.string(), z.number()).default({}),
  revisar: z.array(z.string()).default([]),
});

export type Perfil = z.infer<typeof esquemaPerfil>;

type DocumentoLeido = {
  tipo: string;
  datos: Extraccion | null;
  estado: string;
};

export function consolidarPerfil(documentos: DocumentoLeido[], ahora = new Date()): Perfil {
  const revisar = new Set<string>();
  const confianza: Record<string, number> = {};
  let ingresoMensual: number | null = null;
  let empleador: string | null = null;
  let fechaIngreso: string | null = null;
  let tipoContrato: string | null = null;
  let fechaNacimiento: string | null = null;
  let obligacionesMensuales: number | null = null;
  const empleadores = new Set<string>();

  for (const documento of documentos) {
    if (documento.estado === "REVISAR" || documento.estado === "ERROR") {
      revisar.add(documento.tipo);
    }
    const datos = documento.datos;
    if (!datos || datos.tipo === "otro") continue;
    for (const [campo, valor] of Object.entries(datos.campos)) {
      if (valor.confianza < UMBRAL_CONFIANZA || valor.valor === null) {
        revisar.add(campo);
      }
      confianza[campo] = valor.confianza;
    }
    if (datos.tipo === "desprendible") {
      ingresoMensual = datos.campos.totalDevengado.valor ?? datos.campos.salarioBasico.valor;
      if (datos.campos.empleador.valor) empleadores.add(datos.campos.empleador.valor);
      empleador = datos.campos.empleador.valor ?? empleador;
    }
    if (datos.tipo === "certificado_laboral") {
      fechaIngreso = datos.campos.fechaIngreso.valor;
      tipoContrato = datos.campos.tipoContrato.valor;
      if (datos.campos.empleador.valor) empleadores.add(datos.campos.empleador.valor);
      empleador = datos.campos.empleador.valor ?? empleador;
    }
    if (datos.tipo === "cedula") fechaNacimiento = datos.campos.fechaNacimiento.valor;
    if (datos.tipo === "extracto") {
      obligacionesMensuales = datos.campos.obligacionesMensuales.valor;
    }
  }
  if (empleadores.size > 1) revisar.add("empleador");

  return esquemaPerfil.parse({
    ingresoMensual,
    antiguedadLaboralMeses: mesesEntre(fechaIngreso, ahora),
    empleador,
    edad: aniosEntre(fechaNacimiento, ahora),
    tipoContrato,
    obligacionesMensuales,
    confianza,
    revisar: [...revisar],
  });
}

function mesesEntre(inicio: string | null, ahora: Date) {
  if (!inicio) return null;
  const fecha = new Date(`${inicio}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return null;
  return (ahora.getUTCFullYear() - fecha.getUTCFullYear()) * 12 + (ahora.getUTCMonth() - fecha.getUTCMonth());
}

function aniosEntre(inicio: string | null, ahora: Date) {
  const meses = mesesEntre(inicio, ahora);
  return meses === null ? null : Math.floor(meses / 12);
}

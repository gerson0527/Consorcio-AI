import { enmascararTextoParaIa } from "@/lib/crypto";
import {
  esquemasPorTipo,
  UMBRAL_CONFIANZA,
  type Extraccion,
} from "@/modules/ingesta/esquemas";

type Tipo = keyof typeof esquemasPorTipo;

const camposPorTipo: Record<Tipo, string[]> = {
  desprendible: ["empleador", "periodo", "salarioBasico", "totalDevengado", "totalDeducciones"],
  cedula: ["nombre", "fechaNacimiento"],
  certificado_laboral: ["empleador", "cargo", "fechaIngreso", "tipoContrato"],
  extracto: ["entidadFinanciera", "saldoPromedio", "obligacionesMensuales"],
  otro: [],
};

export function extraerSintetico(contenido: string, tipoPedido?: Tipo): Extraccion {
  const lineas = Object.fromEntries(
    contenido
      .split(/\r?\n/)
      .map((linea) => linea.split(":"))
      .filter((partes) => partes.length >= 2)
      .map(([clave, ...resto]) => [clave!.trim(), resto.join(":").trim()]),
  );
  const tipo = (tipoPedido ?? lineas.tipo ?? "otro") as Tipo;
  const esquema = esquemasPorTipo[tipo] ?? esquemasPorTipo.otro;
  const observaciones: string[] = [];
  if (lineas.numero || lineas.documento) {
    observaciones.push("El número de documento se omitió antes de interpretar el archivo.");
  }
  const campos: Record<string, { valor: string | number | null; confianza: number }> = {};
  for (const campo of camposPorTipo[tipo] ?? []) {
    const crudo = lineas[campo];
    if (!crudo) {
      campos[campo] = { valor: null, confianza: 0 };
      continue;
    }
    const numerico = Number(crudo.replace(/\./g, "").replace(",", "."));
    const esNumero = ["salarioBasico", "totalDevengado", "totalDeducciones", "saldoPromedio", "obligacionesMensuales"].includes(campo);
    campos[campo] = esNumero
      ? { valor: Number.isFinite(numerico) ? numerico : null, confianza: Number.isFinite(numerico) ? 0.95 : 0 }
      : { valor: crudo, confianza: 0.95 };
  }
  const datos = esquema.parse({ tipo, campos, observaciones });
  return datos;
}

export function debeRevisar(extraccion: Extraccion) {
  return Object.values(extraccion.campos).some(
    (campo) => campo.valor === null || campo.confianza < UMBRAL_CONFIANZA,
  );
}

export function confianzaMedia(extraccion: Extraccion) {
  const valores = Object.values(extraccion.campos).map((campo) => campo.confianza);
  if (valores.length === 0) return 1;
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

export function textoEnmascarado(contenido: string) {
  return enmascararTextoParaIa(contenido);
}

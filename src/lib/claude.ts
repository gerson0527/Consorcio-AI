import Anthropic from "@anthropic-ai/sdk";

import { analizarEntorno } from "@/lib/env-schema";

const BASE_COARENA = "https://coarena.ai/api";
const CLAVE_PENDIENTE = "pendiente-configurar";
const MODELO_COARENA = "deepseek-v4-1-flash-1017";

export class RespuestaJsonInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "RespuestaJsonInvalidaError";
  }
}

export function claveConfigurada() {
  const clave = analizarEntorno(process.env).ANTHROPIC_API_KEY.trim();
  return clave.length > 0 && clave !== CLAVE_PENDIENTE;
}

export async function pedirJson<T>(opciones: {
  sistema: string;
  contenido: Anthropic.ContentBlockParam[] | string;
  esquema: { parse: (dato: unknown) => T; toJSONSchema: () => object };
  maxTokens?: number;
}) {
  const entorno = analizarEntorno(process.env);
  const cliente = new Anthropic({
    apiKey: entorno.ANTHROPIC_API_KEY,
    baseURL: BASE_COARENA,
  });
  const esquemaJson = opciones.esquema.toJSONSchema() as Record<string, unknown>;
  const inicio = Date.now();
  const respuesta = await cliente.messages.create({
    model: MODELO_COARENA,
    max_tokens: opciones.maxTokens ?? 4000,
    system: opciones.sistema,
    messages: [{ role: "user", content: opciones.contenido }],
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: esquemaJson },
    },
  });
  const texto = respuesta.content
    .filter((bloque) => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("");
  const datos = parsearRespuestaJson(texto, respuesta.stop_reason, opciones.esquema);
  return {
    datos,
    modelo: respuesta.model,
    tokens: respuesta.usage.input_tokens + respuesta.usage.output_tokens,
    duracionMs: Date.now() - inicio,
  };
}

export function parsearRespuestaJson<T>(
  texto: string,
  motivoParada: string | null,
  esquema: { parse: (dato: unknown) => T },
) {
  if (motivoParada === "max_tokens") {
    throw new RespuestaJsonInvalidaError("La respuesta JSON de la IA quedó truncada.");
  }
  if (!texto.trim()) {
    throw new RespuestaJsonInvalidaError("La IA devolvió una respuesta JSON vacía.");
  }
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new RespuestaJsonInvalidaError("La IA devolvió una respuesta JSON incompleta.");
  }
  return esquema.parse(json);
}

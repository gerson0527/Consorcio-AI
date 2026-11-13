import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { Prisma } from "@prisma/client";

import { claveConfigurada, pedirJson } from "@/lib/claude";
import { leerArchivo } from "@/lib/almacen";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/modules/auditoria";
import {
  confianzaMedia,
  debeRevisar,
  extraerSintetico,
  textoEnmascarado,
} from "@/modules/ingesta/extraer";
import { esquemasPorTipo, type Extraccion } from "@/modules/ingesta/esquemas";
import { consolidarPerfil } from "@/modules/ingesta/perfil";
import { PROMPT_EXTRACCION, VERSION_PROMPT } from "@/modules/ingesta/prompts/extraccion";

export async function procesarDocumento(documentoId: string) {
  const documento = await prisma.documento.findUnique({
    where: { id: documentoId },
    include: { caso: { include: { cliente: { include: { consentimientos: true } } } } },
  });
  if (!documento) return;
  if (documento.caso.cliente.consentimientos.length === 0) {
    await prisma.documento.update({
      where: { id: documento.id },
      data: { estado: "ERROR", observaciones: "No hay consentimiento registrado." },
    });
    return;
  }
  if (documento.estado === "PROCESADO") return;

  await prisma.documento.update({ where: { id: documento.id }, data: { estado: "PROCESANDO" } });
  const bytes = await leerArchivo(documento.archivoKey);
  const tipo = documento.tipo as keyof typeof esquemasPorTipo;
  let extraccion: Extraccion | null = null;
  let modelo = "local-sin-api";
  let tokens = 0;
  let errorValidacion = "";

  for (let intento = 0; intento < 2 && !extraccion; intento += 1) {
    try {
      if (claveConfigurada() && documento.tipo !== "otro") {
        const esquema = (esquemasPorTipo[tipo] ?? esquemasPorTipo.otro) as {
          parse: (dato: unknown) => Extraccion;
          toJSONSchema: () => object;
        };
        const respuesta = await pedirJson({
          sistema: PROMPT_EXTRACCION,
          contenido: [
            mediaClaude(bytes),
            {
              type: "text",
              text: `${errorValidacion}\nTipo esperado: ${documento.tipo}. No incluyas el número de documento.`,
            },
          ],
          esquema,
        });
        extraccion = respuesta.datos;
        modelo = respuesta.modelo;
        tokens = respuesta.tokens;
      } else {
        extraccion = extraerSintetico(textoEnmascarado(bytes.toString("utf8")), tipo);
        modelo = "extractor-sintetico";
      }
    } catch (error) {
      errorValidacion = error instanceof Error ? error.message : "La salida no cumple el esquema.";
      extraccion = null;
    }
  }

  if (!extraccion) {
    await prisma.documento.update({
      where: { id: documento.id },
      data: { estado: "REVISAR", observaciones: errorValidacion || "No se pudo leer el documento." },
    });
    return;
  }

  const revisar = debeRevisar(extraccion);
  await prisma.documento.update({
    where: { id: documento.id },
    data: {
      estado: revisar ? "REVISAR" : "PROCESADO",
      datosExtraidos: extraccion as Prisma.InputJsonValue,
      confianza: confianzaMedia(extraccion),
      observaciones: extraccion.observaciones.join(" ") || null,
    },
  });
  await consolidarCaso(documento.casoId);
  await registrarAuditoria({
    accion: "extraer_documento",
    objetoTipo: "Documento",
    objetoId: documento.id,
    detalle: { modelo, tokens, versionPrompt: VERSION_PROMPT, tipo: documento.tipo },
  });
}

async function consolidarCaso(casoId: string) {
  const documentos = await prisma.documento.findMany({ where: { casoId } });
  const perfil = consolidarPerfil(
    documentos.map((documento) => ({
      tipo: documento.tipo,
      estado: documento.estado,
      datos: documento.datosExtraidos as Extraccion | null,
    })),
  );
  const contradiccion = perfil.revisar.includes("empleador");
  if (contradiccion) {
    await prisma.documento.updateMany({
      where: { casoId, tipo: { in: ["desprendible", "certificado_laboral"] }, estado: "PROCESADO" },
      data: { estado: "REVISAR", observaciones: "Hay contradicción entre documentos." },
    });
  }
  await prisma.caso.update({
    where: { id: casoId },
    data: { perfil: perfil as Prisma.InputJsonValue },
  });
}

function mediaClaude(bytes: Buffer): ContentBlockParam {
  const base64 = bytes.toString("base64");
  if (bytes.subarray(0, 4).toString() === "%PDF") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } };
  }
  if (bytes[0] === 0x89) {
    return { type: "image", source: { type: "base64", media_type: "image/png", data: base64 } };
  }
  return { type: "text", text: textoEnmascarado(bytes.toString("utf8")) };
}

export { consolidarCaso };

import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

import { analizarEntorno } from "../src/lib/env-schema";
import { cifrarJson, descifrarCampo, hashDocumento } from "../src/lib/crypto";

if (existsSync(".env")) process.loadEnvFile(".env");

const prisma = new PrismaClient();
const clave = Buffer.from(analizarEntorno(process.env).FIELD_ENCRYPTION_KEY, "base64");
const simulacion = process.argv.includes("--dry-run");

async function protegerClientes() {
  let cursor: string | undefined;
  let actualizados = 0;
  for (;;) {
    const clientes = await prisma.cliente.findMany({
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      select: { id: true, documentoHash: true, documentoCifrado: true },
    });
    if (clientes.length === 0) break;
    for (const cliente of clientes) {
      if (cliente.documentoHash.startsWith("suprimido-")) continue;
      const documento = descifrarCampo(cliente.documentoCifrado, clave);
      const hash = hashDocumento(documento, clave);
      if (hash === cliente.documentoHash) continue;
      if (!simulacion) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: { documentoHash: hash },
        });
      }
      actualizados += 1;
    }
    cursor = clientes.at(-1)?.id;
  }
  return actualizados;
}

async function protegerPerfiles() {
  let cursor: string | undefined;
  let actualizados = 0;
  for (;;) {
    const casos = await prisma.caso.findMany({
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      select: { id: true, perfil: true },
    });
    if (casos.length === 0) break;
    for (const caso of casos) {
      if (caso.perfil === null || typeof caso.perfil === "string") continue;
      if (!simulacion) {
        await prisma.caso.update({
          where: { id: caso.id },
          data: { perfil: cifrarJson(caso.perfil, clave) },
        });
      }
      actualizados += 1;
    }
    cursor = casos.at(-1)?.id;
  }
  return actualizados;
}

async function protegerExtracciones() {
  let cursor: string | undefined;
  let actualizados = 0;
  for (;;) {
    const documentos = await prisma.documento.findMany({
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      select: { id: true, datosExtraidos: true },
    });
    if (documentos.length === 0) break;
    for (const documento of documentos) {
      if (
        documento.datosExtraidos === null ||
        typeof documento.datosExtraidos === "string"
      ) {
        continue;
      }
      if (!simulacion) {
        await prisma.documento.update({
          where: { id: documento.id },
          data: { datosExtraidos: cifrarJson(documento.datosExtraidos, clave) },
        });
      }
      actualizados += 1;
    }
    cursor = documentos.at(-1)?.id;
  }
  return actualizados;
}

async function main() {
  const hashes = await protegerClientes();
  const perfiles = await protegerPerfiles();
  const extracciones = await protegerExtracciones();
  const accion = simulacion ? "Pendiente (simulación)" : "Actualizados";
  console.info(
    `Protección ${simulacion ? "simulada" : "completada"}. Hashes ${accion.toLowerCase()}: ${hashes}; perfiles cifrados ${accion.toLowerCase()}: ${perfiles}; extracciones cifradas ${accion.toLowerCase()}: ${extracciones}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("No se pudieron proteger todos los datos sensibles.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

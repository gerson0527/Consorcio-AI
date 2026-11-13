import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { analizarEntorno } from "@/lib/env-schema";

function entorno() {
  return analizarEntorno(process.env);
}

function local() {
  const host = new URL(entorno().S3_ENDPOINT).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function ruta(clave: string) {
  const limpia = clave.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(process.cwd(), ".data", "archivos", limpia);
}

function clienteS3() {
  const datos = entorno();
  return new S3Client({
    region: datos.S3_REGION,
    endpoint: datos.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: datos.S3_ACCESS_KEY,
      secretAccessKey: datos.S3_SECRET_KEY,
    },
  });
}

export async function guardarArchivo(clave: string, cuerpo: Buffer, tipo: string) {
  if (local()) {
    const destino = ruta(clave);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, cuerpo);
    return;
  }
  await clienteS3().send(
    new PutObjectCommand({
      Bucket: entorno().S3_BUCKET,
      Key: clave,
      Body: cuerpo,
      ContentType: tipo,
    }),
  );
}

export async function leerArchivo(clave: string) {
  if (local()) return readFile(ruta(clave));
  const respuesta = await clienteS3().send(
    new GetObjectCommand({ Bucket: entorno().S3_BUCKET, Key: clave }),
  );
  const bytes = await respuesta.Body?.transformToByteArray();
  if (!bytes) throw new Error("Archivo vacío");
  return Buffer.from(bytes);
}

export async function urlFirmada(clave: string, segundos = 300) {
  if (!local()) {
    return getSignedUrl(
      clienteS3(),
      new GetObjectCommand({ Bucket: entorno().S3_BUCKET, Key: clave }),
      { expiresIn: segundos },
    );
  }
  const expira = Date.now() + segundos * 1000;
  const firma = firmar(`${clave}.${expira}`);
  const url = new URL("/api/archivos", entorno().APP_URL);
  url.searchParams.set("clave", clave);
  url.searchParams.set("expira", String(expira));
  url.searchParams.set("firma", firma);
  return url.pathname + url.search;
}

export function firmaValida(clave: string, expira: string, firma: string) {
  const momento = Number(expira);
  if (!Number.isFinite(momento) || momento < Date.now()) return false;
  const esperada = firmar(`${clave}.${expira}`);
  const izquierda = Buffer.from(esperada);
  const derecha = Buffer.from(firma);
  return izquierda.length === derecha.length && timingSafeEqual(izquierda, derecha);
}

function firmar(valor: string) {
  return createHmac("sha256", entorno().AUTH_SECRET).update(valor).digest("base64url");
}

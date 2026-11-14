import {
  cifrarJson,
  cifrarCampo,
  descifrarCampo,
  descifrarJson,
  enmascararDocumento,
  hashDocumento,
} from "@/lib/crypto";
import { analizarEntorno } from "@/lib/env-schema";

export function claveDatos() {
  return Buffer.from(analizarEntorno(process.env).FIELD_ENCRYPTION_KEY, "base64");
}

export function hashDocumentoProtegido(documento: string) {
  return hashDocumento(documento, claveDatos());
}

export function cifrarDatos(valor: unknown) {
  return cifrarJson(valor, claveDatos());
}

export function leerDatos<T>(valor: unknown) {
  return descifrarJson<T>(valor, claveDatos());
}

export function cifrarDocumento(documento: string) {
  return cifrarCampo(documento, claveDatos());
}

export function documentoEnmascarado(cifrado: string) {
  const claro = descifrarCampo(cifrado, claveDatos());
  return enmascararDocumento(claro);
}

import { descifrarCampo, enmascararDocumento } from "@/lib/crypto";
import { analizarEntorno } from "@/lib/env-schema";

export function documentoEnmascarado(cifrado: string) {
  const claro = descifrarCampo(
    cifrado,
    Buffer.from(analizarEntorno(process.env).FIELD_ENCRYPTION_KEY, "base64"),
  );
  return enmascararDocumento(claro);
}

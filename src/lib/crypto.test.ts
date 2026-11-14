import { describe, expect, it } from "vitest";

import {
  cifrarJson,
  cifrarCampo,
  descifrarJson,
  descifrarCampo,
  enmascararDocumento,
  enmascararTextoParaIa,
  hashDocumento,
} from "@/lib/crypto";

const clave = Buffer.alloc(32, 9);

describe("cifrado de campos", () => {
  it("recupera el texto original", () => {
    const paquete = cifrarCampo("10203040", clave);
    expect(descifrarCampo(paquete, clave)).toBe("10203040");
  });

  it("no repite el mismo paquete", () => {
    expect(cifrarCampo("10203040", clave)).not.toBe(cifrarCampo("10203040", clave));
  });

  it("rechaza un paquete alterado", () => {
    const paquete = Buffer.from(cifrarCampo("10203040", clave), "base64");
    paquete[30] = paquete[30]! ^ 1;
    expect(() => descifrarCampo(paquete.toString("base64"), clave)).toThrow();
  });

  it("busca por el mismo hash aunque el documento traiga puntos", () => {
    expect(hashDocumento("1.020.304", clave)).toBe(hashDocumento("1020304", clave));
  });

  it("usa una clave para proteger el hash del documento", () => {
    expect(hashDocumento("1020304", clave)).not.toBe(
      hashDocumento("1020304", Buffer.alloc(32, 8)),
    );
  });

  it("cifra perfiles JSON y sigue leyendo los registros existentes durante la migración", () => {
    const perfil = { ingresoMensual: 2500000 };
    const cifrado = cifrarJson(perfil, clave);

    expect(descifrarJson(cifrado, clave)).toEqual(perfil);
    expect(descifrarJson(perfil, clave)).toEqual(perfil);
  });

  it("enmascara el documento y los números largos", () => {
    expect(enmascararDocumento("10203040")).toBe("***3040");
    expect(enmascararTextoParaIa("cédula 1234567890")).toBe("cédula *****");
  });
});

import { describe, expect, it } from "vitest";

import { acciones, puede, type Rol } from "@/lib/autorizacion";

const roles: Rol[] = ["ADMIN", "ANALISTA", "AUDITOR"];

describe("autorización por rol", () => {
  it("el administrador puede hacer todas las acciones", () => {
    for (const accion of acciones) {
      expect(puede("ADMIN", accion)).toBe(true);
    }
  });

  it("el analista no aprueba reglas, no edita entidades y no ve la auditoría", () => {
    expect(puede("ANALISTA", "evaluar")).toBe(true);
    expect(puede("ANALISTA", "editar_clientes")).toBe(true);
    expect(puede("ANALISTA", "aprobar_reglas")).toBe(false);
    expect(puede("ANALISTA", "editar_entidades")).toBe(false);
    expect(puede("ANALISTA", "ver_auditoria")).toBe(false);
    expect(puede("ANALISTA", "suprimir_datos")).toBe(false);
  });

  it("el auditor solo consulta", () => {
    expect(puede("AUDITOR", "ver_auditoria")).toBe(true);
    expect(puede("AUDITOR", "ver_clientes")).toBe(true);
    for (const accion of acciones) {
      if (accion.startsWith("ver_")) continue;
      expect(puede("AUDITOR", accion), accion).toBe(false);
    }
  });

  it("cubre los tres roles", () => {
    expect(roles).toHaveLength(3);
  });
});

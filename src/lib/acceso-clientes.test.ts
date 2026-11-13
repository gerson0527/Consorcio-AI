import { describe, expect, it } from "vitest";

import { filtroCasoPropio, filtroClienteAccesible } from "@/lib/acceso-clientes";

describe("filtros de acceso a clientes", () => {
  it("limita al analista a los casos que tiene asignados", () => {
    const usuario = { id: "analista-1", rol: "ANALISTA" as const };

    expect(filtroCasoPropio(usuario)).toEqual({ analistaId: "analista-1" });
    expect(filtroClienteAccesible(usuario)).toEqual({
      casos: { some: { analistaId: "analista-1" } },
    });
  });

  it("mantiene la vista global para administradores y auditores", () => {
    expect(filtroClienteAccesible({ id: "admin-1", rol: "ADMIN" })).toEqual({});
    expect(filtroClienteAccesible({ id: "auditor-1", rol: "AUDITOR" })).toEqual({});
  });
});

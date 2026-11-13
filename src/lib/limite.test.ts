import { describe, expect, it } from "vitest";

import { limitar, reiniciarLimites } from "@/lib/limite";

describe("límite de tasa", () => {
  it("bloquea cuando se supera el máximo de la ventana", () => {
    reiniciarLimites();
    expect(limitar("login:1", 2, 1_000, 0)).toBe(true);
    expect(limitar("login:1", 2, 1_000, 10)).toBe(true);
    expect(limitar("login:1", 2, 1_000, 20)).toBe(false);
    expect(limitar("login:1", 2, 1_000, 1_001)).toBe(true);
  });
});

import { afterEach, describe, expect, it } from "vitest";

import { encolarExtraccion, iniciarWorker, redisDisponible } from "@/jobs/cola";

const redisOriginal = process.env.REDIS_URL;

afterEach(() => {
  if (redisOriginal === undefined) {
    delete process.env.REDIS_URL;
  } else {
    process.env.REDIS_URL = redisOriginal;
  }
});

describe("cola de documentos", () => {
  it("deja en pausa la cola cuando Redis no está configurado", async () => {
    delete process.env.REDIS_URL;

    expect(redisDisponible()).toBe(false);
    await expect(encolarExtraccion("documento-1")).rejects.toThrow(
      "Redis no está configurado",
    );
    expect(() => iniciarWorker()).toThrow("Redis no está configurado");
  });
});

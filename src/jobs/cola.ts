import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

import { detectarPatrones } from "@/modules/aprendizaje/servicio";
import { procesarDocumento } from "@/modules/ingesta/procesar";

function conexion() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    connectTimeout: 800,
    enableOfflineQueue: false,
  });
}

export async function encolarExtraccion(documentoId: string) {
  try {
    const redis = conexion();
    const cola = new Queue("extraccion", { connection: redis });
    await cola.add(
      "extraer",
      { documentoId },
      {
        jobId: documentoId,
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
      },
    );
    await cola.close();
    redis.disconnect();
  } catch {
    await procesarDocumento(documentoId);
  }
}

export function iniciarWorker() {
  const redis = conexion();
  const extraccion = new Worker(
    "extraccion",
    async (trabajo) => {
      await procesarDocumento(trabajo.data.documentoId as string);
    },
    { connection: redis, concurrency: 2 },
  );
  const aprendizaje = new Worker(
    "aprendizaje",
    async () => {
      await detectarPatrones();
    },
    { connection: redis },
  );
  const cola = new Queue("aprendizaje", { connection: redis });
  void cola.upsertJobScheduler("aprendizaje-horario", { every: 60 * 60 * 1000 }, { name: "detectar", data: {} });
  return { extraccion, aprendizaje, cola };
}

import { Redis } from "@upstash/redis";

let cliente: Redis | undefined;

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Falta configurar UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  cliente ??= new Redis({ url, token });
  return cliente;
}

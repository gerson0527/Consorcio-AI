import "server-only";

import { analizarEntorno, type Entorno } from "@/lib/env-schema";

let cache: Entorno | undefined;

export function getEnv(): Entorno {
  if (!cache) {
    cache = analizarEntorno(process.env);
  }
  return cache;
}

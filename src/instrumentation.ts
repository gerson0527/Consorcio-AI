export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const { getEnv } = await import("@/lib/env");
  getEnv();
  console.info("Entorno validado.");
}

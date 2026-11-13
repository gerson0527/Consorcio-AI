# Consorcio AI

Plataforma de preanálisis crediticio para Consorcio Finance. Recibe documentos del cliente, arma un perfil, lo compara con las políticas de cada entidad y devuelve un ranking con probabilidad, explicación y la política citada.

La IA recomienda, el analista decide. El sistema no aprueba ni rechaza un crédito. El modelo de lenguaje no se reentrena: el aprendizaje es una base de políticas versionadas, calibración estadística con resultados reales y reglas sugeridas que un administrador aprueba.

## Stack

Next.js (App Router) y TypeScript estricto, Tailwind CSS, shadcn/ui, PostgreSQL con Prisma y pgvector, MinIO, BullMQ y Redis, Claude, Auth.js, Zod, Vitest, Playwright (cuando haya e2e), pnpm, Docker Compose.

## Comandos

- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Convenciones

- Una fase a la vez. Al cerrar una fase, verifica, entrega el reporte y detente hasta que la persona escriba `continuar`.
- Entregables listos para usar. Sin `TODO`, funciones vacías ni pseudocódigo.
- Prefiere lo nativo del framework o de la librería. Si creas algo a medida, justifica en `docs/decisiones.md` por qué no había opción nativa.
- No inventes datos del negocio. Los ejemplos viven en el seed y se marcan como ejemplo.
- No afirmes que algo funciona sin haber corrido la verificación y leído el resultado.
- Sin secretos en el código. Valida las entradas con Zod. Autoriza por rol en cada acción y endpoint. Envía el mínimo de datos personales a servicios externos.
- Interfaz, mensajes y documentación en español (Colombia). Nombres de dominio en español (`Cliente`, `Entidad`, `Politica`, `Regla`, `Evaluacion`). Infraestructura en inglés. Moneda COP: `$4.200.000`.
- Antes de agregar un paquete, confirma que no hay solución nativa y que está mantenido. Documenta la dependencia en `docs/decisiones.md`.
- Commits pequeños en Conventional Commits, uno por unidad lógica. No hagas push ni despliegues sin que te lo pidan.
- Cada módulo expone `index.ts` y no importa los internos de otro módulo.
- Antes de cada commit y al cerrar cada fase, usa el skill `verify`.

## Skills

Están en `.claude/skills/`. `prisma-migraciones` y `cierre-despliegue` solo se ejecutan cuando se invocan. `verify` también: corre la suite completa.

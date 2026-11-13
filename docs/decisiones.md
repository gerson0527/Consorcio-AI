# Decisiones

Registro de la Fase 0. Las dependencias de fases posteriores se agregan aquí cuando se instalen.

## Aplicación

- **Next.js 16.4.6** con App Router, TypeScript `strict` y `output: "standalone"`. El modo standalone existe para que la imagen de Docker copie un servidor autónomo y no reinstale dependencias al arrancar.
- **Tailwind CSS 4** y **shadcn/ui 4** con el preset `base-nova` (Base UI). Es la inicialización actual de la librería; los componentes viven en `src/components/ui` y no se reimplementan.
- **Inter** con `next/font`. Es la tipografía pedida y la carga nativa de Next evita una hoja de estilos aparte.
- Los tokens de color y el radio de 12px están en las variables de `src/app/globals.css`, que shadcn ya consume. Se agregaron `--success`, `--warning` e `--ia` porque el tema base no trae esos tres estados.
- El botón de shadcn mide 32px. El alto por defecto, `lg` e iconos principales quedó en 44px para cumplir el objetivo táctil. Los tamaños `xs` y `sm` se conservan para tablas densas.

## Validación de entorno

- **Zod 4** en `src/lib/env-schema.ts`. Next.js no valida el entorno con un esquema, así que el esquema es propio.
- `src/instrumentation.ts` llama la validación al arrancar el runtime de Node. Es el gancho nativo de Next para código de inicio. Durante `next build` (`NEXT_PHASE=phase-production-build`) no se exige el entorno, para no meter secretos en la imagen.
- `server-only` evita que `getEnv()` entre en un bundle de cliente.
- `EMBEDDINGS_PROVIDER` vacío significa `pendiente`. `EMBEDDINGS_DIMENSIONS` puede faltar. El proveedor y la dimensión se cierran en la Fase 3 y quedarán en una sola constante.
- `ANTHROPIC_API_KEY` es la única configuración necesaria para activar Coarena. Si está vacía, la aplicación usa el procesamiento local.

## Calidad

- **ESLint 9** llega con `eslint-config-next@16.4.6`. El registro avisa que ESLint 9 ya no tiene soporte; no se sube a ESLint 10 porque el config de Next aún lo declara en la línea 9.
- **Prettier** y `eslint-config-prettier` evitan reglas de formato duplicadas. No hay formateador nativo en Next.
- **Husky** y **lint-staged** corren Prettier y ESLint sobre lo que se va a commitear. Git no ofrece ese gancho por sí solo.
- **Vitest** cubre el esquema de entorno. **Playwright** se instala cuando existan los flujos e2e; agregarlo ahora no ejecuta ninguna prueba de esta fase.

## Datos y servicios

- PostgreSQL local: imagen `pgvector/pgvector:pg16`, usuario `consorcio`, contraseña `consorcio`, base `consorcio`. Es una clave de desarrollo, escrita en `docker-compose.yml` y en `.env.example`.
- Redis: `redis:7-alpine`.
- MinIO: `minio/minio:RELEASE.2025-09-07T16-13-09Z` y el cliente `minio/mc` con la misma etiqueta. Las credenciales salen de `.env` (`S3_ACCESS_KEY`, `S3_SECRET_KEY`). `minio-init` crea el bucket privado.
- El cifrado en reposo del bucket (SSE-S3 o KMS) no quedó activo. MinIO necesita un KMS para SSE-S3 y en esta máquina no se pudo levantar Docker para probarlo. Producción debe cifrar el bucket; el detalle operativo va en la fase de despliegue.
- La imagen de la app usa Node 24 y pnpm 10.34.9, la misma versión fijada en `packageManager`.

## Fases 1 a 8

- **Prisma 6.19** con Postgres. La columna `embedding` es `vector(384)` y la dimensión vive en `DIMENSION_EMBEDDING`. Prisma no trae un tipo vector de primera clase, por eso el campo es `Unsupported`.
- **Auth.js 5** (`next-auth@5.0.0-beta.30`) con credenciales. Next.js 16 reemplazó `middleware.ts` por `proxy.ts`; la sesión se lee ahí con el JWT, sin consultar la base en cada archivo estático.
- Las contraseñas usan `scrypt` de Node. No se agregó bcrypt porque la biblioteca estándar ya deriva la clave.
- **BullMQ 6** e **ioredis**. Si Redis no acepta la conexión, la extracción sigue en el proceso de la petición. El archivo ya está guardado, así que el trabajo no se pierde.
- **@aws-sdk/client-s3** habla con MinIO. En localhost el mismo contrato escribe en disco, porque aquí no hay Docker.
- **@anthropic-ai/sdk 1.8**. El SDK vigente ya no recibe `temperature`. Las llamadas usan `output_config.effort: "low"` y un JSON schema producido por Zod. Sin una clave `sk-ant-`, no se llama a la red.
- El proveedor de embeddings queda en `local`: hash de palabras a 384 dimensiones. No es un modelo semántico. Se eligió para poder probar la búsqueda sin una clave externa. Cambiar de proveedor exige alinear `DIMENSION_EMBEDDING` y la columna.
- `cacheComponents` y `partialPrefetching` del plantel inicial quedaron apagados. El segundo exige el primero, y las pantallas dependen de la sesión: no deben cachearse como contenido público.
- Playwright no se ejecutó: no hay Postgres ni Docker en esta máquina, y el flujo de analista necesita la base.

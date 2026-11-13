# Consorcio AI

Preanálisis crediticio para Consorcio Finance. La IA recomienda y cita la política; el analista toma la decisión. El modelo de lenguaje no se reentrena.

## Requisitos

- Node.js 24 o superior
- pnpm 10
- Docker, para Postgres, Redis y MinIO

## Arranque local

```bash
cp .env.example .env
```

Completa en `.env` los secretos vacíos. `FIELD_ENCRYPTION_KEY` son 32 bytes en base64:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`AUTH_SECRET` debe tener al menos 32 caracteres. `S3_ACCESS_KEY` y `S3_SECRET_KEY` son el usuario y la contraseña de MinIO.

```bash
docker compose up -d postgres redis minio minio-init
pnpm install
pnpm dev
```

La aplicación queda en <http://localhost:3000>.

Configura `ANTHROPIC_API_KEY` en `.env` con tu clave de Coarena. Si la dejas vacía, la aplicación usa el procesamiento local.

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Usuarios de ejemplo

Después de `pnpm seed`, con la base en marcha:

| Correo | Rol | Contraseña |
|---|---|---|
| admin@ejemplo.local | ADMIN | Ejemplo.2026 |
| analista@ejemplo.local | ANALISTA | Ejemplo.2026 |
| auditor@ejemplo.local | AUDITOR | Ejemplo.2026 |

Son cuentas de desarrollo. El seed también carga cuatro entidades marcadas como ejemplo, no entidades reales.

`pnpm worker` procesa la cola cuando Redis está disponible.

## Aprendizaje del sistema

El sistema aprende con políticas versionadas, calibración estadística sobre resultados reales y reglas sugeridas que un administrador aprueba o descarta.

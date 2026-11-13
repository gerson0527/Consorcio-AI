---
name: cierre-despliegue
description: Lista de verificación previa a producción de Consorcio AI, con variables, respaldos, migraciones y plan de reversa. Úsalo solo cuando se pida explícitamente cerrar un despliegue o revisar la salida a producción.
disable-model-invocation: true
---

# Cierre de despliegue

No lo ejecutes durante el desarrollo de una fase. Solo cuando se pida el cierre.

## Antes de salir

- `.env` de producción completo. Sin la clave de desarrollo de Postgres, MinIO ni `FIELD_ENCRYPTION_KEY`.
- `AUTH_SECRET` distinto al de cualquier entorno anterior y con al menos 32 caracteres.
- `ANTHROPIC_API_KEY` real y modelos vigentes en las variables, no identificadores retirados.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y las pruebas e2e de la fase en verde, con la salida guardada.
- `prisma migrate deploy` contra una copia reciente, no `migrate dev`.
- Bucket con cifrado en reposo y sin acceso público. URLs firmadas cortas.
- Respaldo reciente de Postgres y del bucket, y una prueba de restauración hecha, no solo anunciada.
- HTTPS, cabeceras de seguridad y límite de tasa activos.

## Reversa

1. Deja escrito el identificador de la imagen anterior que sigue sirviendo.
2. Si la migración no es reversible, el plan es restaurar el respaldo, no "bajar el código" nada más.
3. Conserva la política vigente anterior. Subir una versión nueva no borra la previa; volver atrás es marcar vigente la versión anterior.
4. Anota quién autoriza la reversa y cómo se avisa a los analistas que estén en un caso.

La lista de puntos jurídicos de Habeas Data se mantiene en `docs/operacion.md` como pendientes de validación por el asesor de Consorcio Finance, no como concepto legal.

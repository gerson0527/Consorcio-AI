---
name: prisma-migraciones
description: Aplica el flujo de migraciones de Prisma en Consorcio AI cuando cambia prisma/schema.prisma, hay que crear una migración, revisar SQL de pgvector o cuidar datos ya existentes. No lo uses para consultas sueltas ni para cambiar pantallas.
disable-model-invocation: true
---

# Migraciones de Prisma

Úsalo solo cuando alguien lo invoque y el cambio toque `prisma/schema.prisma`.

## Flujo

1. Revisa relaciones, `onDelete` y unicidad antes de generar SQL. El esquema del prompt maestro es la intención, no un archivo que compile sin revisión.
2. Crea la migración con `pnpm exec prisma migrate dev --name <cambio_en_snake_case>`. El nombre describe el cambio (`crear_clientes`, `agregar_embedding_fragmento`), no la fecha.
3. Lee el SQL en `prisma/migrations/<nombre>/migration.sql` antes de darlo por bueno. No edites una migración ya aplicada en un entorno compartido; crea otra.
4. Si hay filas existentes, la migración debe tener un valor por defecto o un paso de relleno. No borres columnas con datos sin decirlo en el reporte.
5. Corre `pnpm exec prisma generate` si el cliente quedó desactualizado y `pnpm typecheck`.

## pgvector

- La extensión se habilita en SQL: `CREATE EXTENSION IF NOT EXISTS vector;`.
- La columna de embedding no se modela como un tipo nativo de Prisma si la versión instalada no lo trae. Usa `Unsupported("vector")` y confirma la sintaxis en la documentación de Prisma vigente antes de escribir el esquema.
- La dimensión sale de una sola constante, decidida en la Fase 3. El SQL de la columna debe usar esa misma dimensión.
- La búsqueda por similitud va con `$queryRaw` parametrizado, filtrando por entidad y por la política vigente. No concatentes texto del usuario dentro del SQL.
- Cada migración que toque `vector` se prueba contra el Postgres de `docker-compose.yml` (`pgvector/pgvector:pg16`), no contra un Postgres sin la extensión.

Detalle de revisión del SQL: [revision-sql.md](revision-sql.md).

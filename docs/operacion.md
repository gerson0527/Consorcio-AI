# Operación

Esto no es asesoría legal. Consorcio Finance debe validar con su asesor, entre otros puntos: el registro de bases de datos, la política de tratamiento publicada, el plazo de retención que aplique a datos de crédito y los contratos con el proveedor de IA y con quien aloje los archivos.

## Arranque

1. Copiar `.env.example` a `.env` y completar secretos. `FIELD_ENCRYPTION_KEY` son 32 bytes en base64. `AUTH_SECRET` tiene al menos 32 caracteres.
2. `docker compose up -d postgres redis minio minio-init`
3. `pnpm install`
4. `pnpm exec prisma migrate deploy`
5. `pnpm seed` solo en desarrollo. Crea usuarios de ejemplo con la contraseña `Ejemplo.2026`.
6. `pnpm dev` y, en otra terminal, `pnpm worker`.

En local, si `S3_ENDPOINT` apunta a localhost, los archivos se guardan en `.data/archivos` y el enlace firmado dura cinco minutos. Dentro de Compose, el servicio `app` apunta `S3_ENDPOINT` a MinIO.

`REDIS_URL` puede omitirse temporalmente para que la aplicación web arranque sin las colas. En ese caso no se pueden cargar documentos ni ejecutar extracción; configura Redis y vuelve a desplegar para reactivar ese flujo.

Después de desplegar código que cifre perfiles/extracciones o cambie el hash del documento, ejecuta `pnpm db:proteger-datos` una sola vez contra la base correcta. El script es idempotente y convierte registros existentes en lotes; no lo ejecutes con una clave `FIELD_ENCRYPTION_KEY` distinta de la usada por esa instalación.

## Variables

Están en `.env.example`. Los modelos vigentes al 2026-11-12 son `claude-haiku-5-5` para extracción y `claude-sonnet-5-5` para el análisis. El SDK actual no expone temperatura; las llamadas usan `effort: low` y un JSON schema.

`EMBEDDINGS_PROVIDER=local` usa un hash de palabras de 384 dimensiones, definido en `src/modules/conocimiento/constantes.ts`. Sirve para desarrollo y pruebas. No es un embedding semántico de producción. Cuando se contrate un proveedor, la dimensión de la columna `vector(384)` tiene que coincidir o hará falta una migración.

## Respaldos

- Postgres: `pg_dump` diario de la base `consorcio`, más una prueba de restauración.
- Archivos: copia del bucket (o de `.data/archivos` en local). El cifrado SSE del bucket de MinIO no quedó activo en el compose local; en producción el bucket debe cifrar en reposo.
- La clave `FIELD_ENCRYPTION_KEY` se guarda fuera del repositorio. Se usa para cifrar campos y derivar el HMAC del documento. Rotarla exige reescribir los campos cifrados y los hashes con la clave nueva, y conservar la anterior hasta terminar.

## Migraciones y reversa

`pnpm exec prisma migrate deploy` en producción. No uses `migrate dev` contra datos reales.

Si una migración no se puede revertir con SQL, el camino es restaurar el respaldo de Postgres y la copia de archivos, y volver a la imagen anterior de la aplicación. Una política nueva no borra la anterior: se puede marcar vigente la versión previa.

## Monitoreo

El worker escribe en la salida estándar. Una extracción fallida deja el documento en `REVISAR` o `ERROR` y el archivo sigue guardado. La cola reintenta cinco veces si Redis está disponible.

## Supresión

Un administrador puede suprimir los datos de un cliente desde su caso. Eso anonimiza el nombre, borra el perfil y los documentos y deja un rastro de auditoría sin el número de documento.

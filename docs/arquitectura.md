# Arquitectura

Consorcio AI es una aplicación Next.js. Las pantallas viven en `src/app` y llaman Server Actions. La lógica de negocio está en `src/modules`; cada módulo se usa por su `index.ts`.

El flujo de un caso es: consentimiento, documentos, extracción, perfil, reglas determinísticas, búsqueda en la política vigente y un análisis que cita fragmentos. La probabilidad sale de la calibración histórica, no del modelo de lenguaje. Una regla sugerida permanece en `PENDIENTE` hasta que un administrador la aprueba.

Postgres guarda el negocio y los embeddings `vector(384)`. Los archivos van a MinIO cuando el endpoint no es localhost; en esta máquina, con `S3_ENDPOINT=http://localhost:9000`, quedan en `.data/archivos`. Redis mueve la cola BullMQ. Si no hay `REDIS_URL`, la aplicación web arranca pero la carga y extracción de documentos quedan pausadas. Si Redis está configurado pero no responde, la extracción corre en la misma petición para no perder el archivo.

Sin una clave real de Anthropic (`sk-ant-...`), la extracción usa documentos de texto sintético y el análisis cita los fragmentos con una rutina local. El identificador queda en `modeloIA` como `local-sin-api` o `extractor-sintetico`.

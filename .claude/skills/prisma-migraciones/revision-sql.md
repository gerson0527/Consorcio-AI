# Revisión del SQL de migración

Antes de cerrar la migración, confirma:

- No hay `DROP TABLE` ni `DROP COLUMN` que el cambio no haya pedido.
- Los `enum` nuevos no reescriben valores ya guardados.
- Las claves foráneas apuntan al campo correcto y el borrado en cascada solo está donde el esquema lo pide (`Fragmento` se va con su `Politica`).
- `@@unique([entidadId, version])` en `Politica` sigue presente.
- El índice de `AuditLog` sobre `objetoTipo` y `objetoId` sigue presente.
- La columna `vector` no se crea con una dimensión distinta a la constante del proyecto.
- Un índice de similitud, si se agrega, declara el operador (`vector_cosine_ops` u el que se haya elegido) y se menciona en `docs/decisiones.md`.

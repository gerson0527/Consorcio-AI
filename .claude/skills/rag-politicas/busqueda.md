# Búsqueda y citas

## Metadatos de cada fragmento

- `orden`
- `seccion` (título detectado, si existe)
- `pagina`
- `texto`
- embedding en pgvector, con la dimensión de la constante única del proyecto

## Consulta

1. Filtra `Politica.vigente = true` y la entidad pedida.
2. Ordena por similitud con `$queryRaw` parametrizado.
3. Devuelve los fragmentos con `fragmentoId`, `seccion`, `pagina` y `texto`.

## Cita

```json
{ "fragmentoId": "id", "seccion": "título", "pagina": 1, "texto": "extracto corto" }
```

Si la lista vuelve vacía, el contrato de evaluación usa el veredicto `INSUFICIENTE` y enumera qué falta. No se redacta una política que no esté en los fragmentos.

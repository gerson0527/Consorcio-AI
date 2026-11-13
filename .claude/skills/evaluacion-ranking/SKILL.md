---
name: evaluacion-ranking
description: Orquesta reglas, búsqueda de políticas y ranking de Consorcio AI cuando se cambie la evaluación de un caso, el JSON de veredicto, la probabilidad, la confianza o la versión del prompt. Úsalo al tocar src/modules/evaluacion o la pantalla de mejores opciones.
---

# Evaluación y ranking

1. Ejecuta el motor de reglas.
2. Recupera fragmentos de la política vigente.
3. Pide a Claude el análisis de casos grises, en JSON validado con Zod. Temperatura baja.
4. Calcula el orden. La probabilidad no la inventa el modelo: sale del módulo de aprendizaje. Sin muestras suficientes, `probabilidad` es `null` y la confianza es `BAJA`.

## Salida del modelo

```json
{
  "entidadId": "string",
  "veredicto": "FAVORABLE | CONDICIONADO | DESFAVORABLE | INSUFICIENTE",
  "explicacion": "texto en español, máximo 120 palabras",
  "condiciones": ["certificado laboral vigente"],
  "faltantes": ["extracto de los últimos 3 meses"],
  "citas": [{ "fragmentoId": "string", "seccion": "string", "pagina": 0 }]
}
```

Cada `fragmentoId` debe existir en los fragmentos entregados. Si el JSON no valida, se reintenta una vez con el error. Si falla de nuevo, la evaluación queda para revisión humana.

El prompt vive en `src/modules/evaluacion/prompts/` con la constante `VERSION_PROMPT`. Esa versión y el identificador del modelo se guardan en `Evaluacion`.

## Orden y confianza

- Primero, las entidades que cumplen las reglas activas.
- Después, el veredicto (`FAVORABLE`, luego `CONDICIONADO`, luego `DESFAVORABLE`). `INSUFICIENTE` no se presenta como opción favorable.
- La probabilidad, cuando existe, desempata dentro del mismo grupo.
- Confianza `ALTA` solo con reglas evaluadas, citas válidas y muestras de calibración por encima del mínimo. `MEDIA` cuando el veredicto está citado pero la calibración no alcanza. `BAJA` cuando falta un dato, un documento o la evidencia de política.

La pantalla muestra la franja: la IA recomienda y cita la política; la decisión final es del analista.

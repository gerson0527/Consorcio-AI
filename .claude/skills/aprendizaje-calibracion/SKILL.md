---
name: aprendizaje-calibracion
description: Calibra probabilidades y propone reglas en Consorcio AI cuando se registre un resultado real, se recalcule la calibración por entidad o se sugiera una regla. Úsalo al tocar src/modules/aprendizaje. No reentrena el modelo de lenguaje.
---

# Calibración y reglas sugeridas

El modelo de lenguaje no se reentrena. Claude solo redacta la explicación de una regla que el sistema ya detectó con un patrón medible.

## Calibración

- Se calcula por entidad: aprobación predicha frente a aprobación real.
- Con menos de `CALIBRACION_MIN_MUESTRAS` (30 por defecto) no se muestra probabilidad. Queda `null` y la confianza de esa cifra es `BAJA`.
- Registrar un resultado real dispara el recálculo de esa entidad.

## Regla sugerida

- Sale de un patrón con soporte mínimo `REGLA_SUGERIDA_MIN_SOPORTE` (10) y precisión mínima `REGLA_SUGERIDA_MIN_PRECISION` (0.9).
- Se guarda en estado `PENDIENTE`, origen `SUGERIDA_IA`, con `evidencia` (casos y periodo).
- Solo un `ADMIN` puede aprobarla o descartarla. Aprobar la pasa a `ACTIVA` y deja registro de auditoría. Descartarla la deja en `RECHAZADA`.
- Ninguna ruta de código activa una regla sugerida sin esa decisión.

# Esquemas de extracción

Cada campo leído tiene `valor` y `confianza` (número de 0 a 1). `observaciones` es una lista de textos.

Ejemplo de desprendible:

```json
{
  "tipo": "desprendible",
  "campos": {
    "empleador": { "valor": "string", "confianza": 0.0 },
    "periodo": { "valor": "YYYY-MM", "confianza": 0.0 },
    "salarioBasico": { "valor": 0, "confianza": 0.0 },
    "totalDevengado": { "valor": 0, "confianza": 0.0 },
    "totalDeducciones": { "valor": 0, "confianza": 0.0 }
  },
  "observaciones": ["texto ilegible en la parte inferior"]
}
```

Tipos de archivo previstos: `cedula`, `desprendible`, `certificado_laboral`, `extracto`, `otro`.

El perfil del caso se consolida solo con campos que pasaron Zod. Un campo en `null` no se inventa al armar el perfil: queda ausente y la evaluación posterior lo reporta como faltante.

Montos en pesos colombianos, sin separadores dentro del JSON. La pantalla los muestra como `$4.200.000`.

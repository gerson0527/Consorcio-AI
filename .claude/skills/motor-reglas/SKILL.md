---
name: motor-reglas
description: Define el motor determinístico de reglas de crédito de Consorcio AI cuando se agreguen o cambien operadores, la evaluación de una Regla o el formato de reglasDetalle. Úsalo al tocar src/modules/reglas.
---

# Motor de reglas

La evaluación es una función pura: mismos perfil, reglas y operadores producen el mismo `reglasDetalle`. No llama al modelo de lenguaje.

## Operadores

`>=`, `<=`, `==`, `in`, `between`.

Cada operador tiene pruebas unitarias de cumple, no cumple, dato ausente y tipo incompatible. Un dato ausente no cuenta como rechazo silencioso: el detalle marca el dato como faltante.

## reglasDetalle

Lista de objetos:

```json
{
  "reglaId": "id",
  "campo": "ingresoMensual",
  "operador": ">=",
  "esperado": 2000000,
  "valorLeido": 1800000,
  "resultado": "no_cumple",
  "mensaje": "El ingreso mensual no alcanza el mínimo de la entidad."
}
```

`resultado` es `cumple`, `no_cumple` o `faltante`.

`cumpleReglas` es verdadero solo cuando ninguna regla activa aplicable dio `no_cumple`. Si hay faltantes, la evaluación lo dice aparte y no los trata como cumplimiento.

Una regla sugerida nace en `PENDIENTE`. Solo una regla `ACTIVA` entra al motor. El origen `SUGERIDA_IA` no la activa.

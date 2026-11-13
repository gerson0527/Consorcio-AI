---
name: verify
description: Corre la verificación de Consorcio AI antes de cada commit y al cerrar una fase. Úsalo cuando haya que ejecutar pnpm lint, pnpm typecheck, pnpm test y pnpm build, o cuando se pida el reporte de fase con resultados reales.
disable-model-invocation: true
---

# Verificar Consorcio AI

Ejecuta los comandos en la raíz del repositorio, en este orden. No los des por buenos si no leíste la salida.

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`
5. Si la fase definió pruebas e2e, corre también el comando de Playwright que esa fase haya dejado en `package.json`. Si no existe, dilo y no inventes un resultado.

Si un comando falla, pega el error completo, corrige la causa y vuelve a correr desde el comando que falló. No resumes un fallo como "problemas menores".

Entrega, para cada comando: el comando, el código de salida y las líneas finales relevantes (errores, conteo de pruebas o la ruta compilada).

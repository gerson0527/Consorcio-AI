# Tokens visuales de CLIKit

Medidos el 12 de noviembre de 2026 en https://v0-clik-it-ui-designer.vercel.app/ con Chrome headless a 1440×900. Los colores de `:root` salen del CSS publicado y de los estilos en línea. No hay un segundo tema en la hoja de estilos.

## Superficies

| Token de la referencia | Valor | Uso en Consorcio AI |
| --- | --- | --- |
| `--background` / `--theme-bg` | `#000000` | Fondo de la aplicación y del marco |
| `--card` / `--theme-card` | `#111111` | Barra superior y tarjetas compactas |
| `--sidebar` / `--theme-chrome` | `#0a0a0a` | Panel izquierdo y barra del marco |
| `--border` / `--theme-border` | `#333333` | Bordes de 1 px, sin sombra en paneles |
| `--foreground` / `--theme-fg` | `#ededed` | Texto principal |
| `--muted-foreground` / `--theme-muted` | `#888888` | Subtítulo y estados vacíos |
| `--primary` / `--theme-accent` | `#ffffff` | Acción principal, texto `#000000` |
| `--secondary`, `--muted`, `--accent`, `--input` | `#1a1a1a` | Fondos de apoyo |
| `--destructive` | `#ff6166` | Error |
| `--radius` | `0.5rem` | `rounded-lg` del marco y `rounded-md` de los botones |

El color `#666666` aparece en la referencia y no alcanza contraste AA sobre `#000000` (3.66:1). El texto secundario usa `#888888`, que sí pasa (5.92:1 sobre negro, 5.33:1 sobre `#111111`).

## Medidas

- Barra superior: `h-12` (48 px) y `md:h-14` (56 px), padding `px-2` / `md:px-4`.
- Marca: `text-xs md:text-base`, peso 600. Subtítulo: `text-xs`, oculto bajo `lg`.
- Panel izquierdo: `w-60` (240 px), fondo `#0a0a0a`, borde derecho de 1 px.
- Panel derecho: `w-72` (288 px), oculto bajo `lg`, fondo `#111111`.
- Marco central: `rounded-lg`, borde 1 px, padding exterior `p-2 md:p-4`.
- Botones de la rejilla: `h-14`, `text-xs`, `gap-1`, `rounded-md`, fondo `#111111`.
- Puntos del marco: `#ff5f56`, `#ffbd2e`, `#27c93f`.

## Tipografía

La captura adjunta muestra Geist seleccionado. El HTML por defecto de esa carga usaba JetBrains Mono en `body`. Consorcio AI usa Geist y Geist Mono con `next/font`, pesos 400, 500 y 600 en la sans y 400 en la mono.

## Tema claro

La referencia no define tema claro. `.light` invierte los mismos roles: fondo blanco, texto `#111111`, cromo `#f5f5f5`, borde `#d4d4d4`. El verde y el ámbar se oscurecen a `#147a28` y `#8a5a00` para mantener AA sobre blanco. No está activo.

## Decisiones

- No se bloquea el zoom (`maximum-scale=1` de la referencia). Impide el texto grande y baja la accesibilidad.
- El acento de IA no existe en la referencia. `--ia` reutiliza `#ededed` y `#1a1a1a`. El estado se dice con texto, no con un color nuevo.
- Éxito y alerta toman el verde y el ámbar medidos en los puntos del marco.

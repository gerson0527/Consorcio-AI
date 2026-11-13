---
name: ui-consorcio
description: Aplica la interfaz de Consorcio AI al crear o cambiar pantallas, layout, tablas, estados vacíos o estilos. Úsalo al trabajar en src/app o src/components, con Tailwind y los componentes de shadcn/ui.
---

# Interfaz de Consorcio AI

Usa los componentes de `src/components/ui`. No copies un botón o una tarjeta hechos a mano si shadcn ya tiene el componente.

Los colores viven en las variables de `src/app/globals.css`:

- Primario `#1F4FD8`
- Éxito `#12805C` sobre `#E3F4EC`
- Alerta `#B26A12` sobre `#FCF0DC`
- IA `#5B3FB8` sobre `#EEE9FA`
- Fondo `#F4F5F7`, tarjetas blancas, borde `#E1E5EC`, radio 12px
- Texto `#141B2D`, secundario `#566074`
- Tipografía Inter
- Objetivo táctil de 44px. El botón por defecto ya mide 44px. En controles compactos (`xs`, `sm`) no los uses como acción principal en móvil.

Montos en COP: `$4.200.000`. Textos de la interfaz en español de Colombia.

Layout de la aplicación, cuando exista la barra: 232px, marca CF y Consorcio Finance, enlaces a Clientes, Entidades, Reglas sugeridas (con contador) y Reportes, rol al pie. El contenido fluye en móvil.

Cada pantalla que traiga datos tiene estado de carga, estado vacío y estado de error. El documento del cliente se muestra enmascarado. La franja de una evaluación dice que la IA recomienda y que la decisión es del analista.

Contraste mínimo AA. No dependas solo del color para un estado: acompáñalo con texto.

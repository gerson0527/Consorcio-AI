---
name: web-design-top-scores
description: Úsalo siempre que se cree o modifique una página, landing, componente o interfaz web. Garantiza diseño de calidad con puntuaciones Lighthouse de 95-100 en Rendimiento, Accesibilidad, Buenas prácticas y SEO, además de Core Web Vitals en verde.
---

# Diseño web con las mejores puntuaciones

## Objetivos medibles
- Lighthouse (móvil): Rendimiento ≥ 95, Accesibilidad = 100, Buenas prácticas = 100, SEO = 100
- LCP < 2.5 s · INP < 200 ms · CLS < 0.1
- Contraste mínimo WCAG AA (4.5:1 texto normal, 3:1 texto grande y componentes UI)

## 1. Dirección de diseño (antes de escribir código)
- Define propósito, audiencia y un tono visual concreto (editorial, minimalista, brutalista, orgánico, etc.). Evita el look genérico de plantilla.
- Una paleta con variables CSS: 1 color dominante, 1 de acento, neutros. Nada de degradados morados por defecto.
- Máximo 2 familias tipográficas, con jerarquía clara (escala 1.200-1.333). Evita Inter/Roboto/Arial por defecto.
- Espaciado en escala consistente (4/8 px). Mucho aire; una sola acción principal por vista.
- Diseño mobile-first; probar en 360 px, 768 px y 1280 px.
- Modo oscuro con tokens, no con colores duplicados.

## 2. Rendimiento
- Imágenes: formato AVIF/WebP, `width` y `height` explícitos, `loading="lazy"` salvo la imagen LCP (`fetchpriority="high"`, sin lazy). En Next.js usar `next/image` con `priority` solo en la imagen LCP y `sizes` correcto.
- Fuentes: `next/font` o `font-display: swap`, subset latino, máximo 2-3 pesos, precargar solo la principal.
- JS: cero librerías innecesarias; componentes de servidor por defecto; `dynamic()` para lo pesado bajo el fold; no cargar scripts de terceros en el camino crítico (usar `next/script` con `strategy="lazyOnload"`).
- CSS: Tailwind con purge activo; sin CSS no usado; evitar `@import` externos.
- Animaciones: solo `transform` y `opacity`; respetar `prefers-reduced-motion`.
- Evitar layout shift: reservar espacio para imágenes, anuncios, embeds y fuentes.
- Caché: assets con hash y `Cache-Control: immutable`; HTML con revalidación o ISR.
- Compresión Brotli y HTTP/2 o HTTP/3 en el servidor.

## 3. Accesibilidad (objetivo 100)
- HTML semántico: `header`, `nav`, `main` (uno solo), `section`, `footer`; jerarquía de `h1`→`h6` sin saltos y un solo `h1`.
- Todo control con nombre accesible: `alt` en imágenes (vacío si es decorativa), `aria-label` en botones de solo icono, `label` asociado a cada input.
- Foco visible siempre (`:focus-visible`), orden de tabulación lógico, enlace "Saltar al contenido".
- Objetivos táctiles ≥ 44×44 px.
- No transmitir información solo con color.
- Modales y menús: gestión de foco, cierre con Esc, `aria-expanded`. Preferir componentes accesibles (Radix/shadcn, `<dialog>`, `<details>`) antes que soluciones propias.
- `lang` correcto en `<html>`.

## 4. SEO (objetivo 100)
- `<title>` único (50-60 caracteres) y `meta description` (140-160) por página.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- URL canónica, `robots.txt`, `sitemap.xml`.
- Open Graph y Twitter Card con imagen 1200×630.
- Datos estructurados JSON-LD (Organization, Product, Article, FAQ según aplique).
- Enlaces con texto descriptivo (nunca "clic aquí"); enlaces rastreables (`<a href>`).
- En Next.js: usar `generateMetadata`, `app/sitemap.ts` y `app/robots.ts`.

## 5. Buenas prácticas
- HTTPS, sin contenido mixto, cabeceras de seguridad (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Sin errores en consola, sin APIs obsoletas, sin `document.write`.
- Imágenes con proporción correcta; favicon y `manifest` presentes.
- Formularios con `autocomplete`, `inputmode` y `type` adecuados.

## 6. Checklist de entrega (verificar antes de dar por terminado)
- [ ] Una sola imagen/elemento LCP identificado y optimizado
- [ ] Cero layout shift visible al cargar
- [ ] Contraste AA verificado en texto y botones
- [ ] Navegación completa solo con teclado
- [ ] `title`, `description`, canonical y OG en cada página
- [ ] Sin dependencias ni scripts innecesarios
- [ ] Probado en móvil real o emulado con throttling 4G lento
- [ ] Ejecutado Lighthouse y corregidos todos los hallazgos antes de entregar

## Reglas de salida
- Entregar código completo y funcional, sin fragmentos "…resto igual".
- Preferir soluciones nativas del framework y de la plataforma web antes que componentes personalizados.
- Comentar solo decisiones no obvias que afecten rendimiento o accesibilidad.

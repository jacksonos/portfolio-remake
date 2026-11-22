# portfolio-remake

Portfolio de Michel Poma: del COBOL y el AS-400 bancario a full stack con IA.

El sitio compone el retrato del titular con teselas en un canvas y lo recorre con un vuelo de cinco estaciones, animado con GSAP, ScrollTrigger y lenis.

## Stack

- Vite
- React 18
- TypeScript
- GSAP (con ScrollTrigger)
- lenis
- fontsource

## Uso

```
npm install
npm run dev       # servidor de desarrollo
npm run build     # tsc -b y build de producción en dist/
npm run preview   # sirve dist/ en local
```

## Estructura

```
src/
  main.tsx, App.tsx   punto de entrada y composición
  content.ts          copy y datos del sitio
  mosaic/             motor de teselas y retrato en canvas
  hero/               portada
  fly/                vuelo de cinco estaciones
  chrome/             cursor, principios, cierre y atajos
  lib/                scroll (lenis + GSAP) y utilidades
  styles/             tokens y CSS por módulo
public/               favicon, portrait.png, og.png
DESIGN.md             decisiones de diseño
```

## Notas

- El copy vive en `src/content.ts`.
- `DESIGN.md` documenta las decisiones de diseño.
- `public/portrait.png` y `public/og.png` son el retrato del titular.

## Despliegue

- Cloudflare Workers con static assets, conectado a este repo: build `npm run build`, salida `dist/`.
- Dominio: https://michelpoma.dev (sin www; www redirige al apex desde el panel de Cloudflare).
- `wrangler.jsonc` define los assets y `not_found_handling: 404-page` (sin SPA: el sitio no tiene rutas).
- `public/_headers` fija cabeceras de seguridad, caché de `/assets/*` y `noindex` en `*.workers.dev`.

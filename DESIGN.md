# portfolio-remake : concepto y contrato (fuente de verdad)

Portfolio de una persona que empezó en COBOL/AS400 bancario y hoy es Full Stack Semi Senior, AI-first.
IMPORTANTE: "SSR" = SEMI SENIOR, nunca server-side rendering. Identidad y datos de contacto en `src/content.ts` (`site`). NO inventar empleadores, fechas ni métricas. Sin emojis. SIN parpadeo / flicker / destellos / oscilación de brillo (el usuario lo rechaza por cansancio visual). Sin glassmorphism, sin degradados, sin morado, sin bento, sin tarjetas redondeadas, sin secciones numeradas decorativas, sin "Inter".
Referencia de inspiración (NO copiar): portfolio con fondo negro, retrato hecho de miles de teselas/pixeles que se forman al cargar, nombre gigante en cursiva serif abajo (recortado por el borde), microetiquetas en 3 columnas arriba, una línea garabateada a mano que cruza el retrato, botón píldora 'Explorar' con flecha en círculo, "scroll to fly through the work".

## Identidad visual
Fondo `--bg #0a0a0b`; texto `--fg #ecebe6`; atenuado `--dim #9a9a94` (AA sobre negro); línea `--line #26262a`; fósforo `--phos #3dff72`; acentos de tesela `--cyan #5ce1e6`, `--amber #ffb000`, grises fríos `#6b7078 #a7acb4`. Tipografía (fontsource, npm): Instrument Serif (italic 400) para nombre y títulos; Geist (variable) para texto y microetiquetas; Geist Mono (variable) para código/metadatos. Radios <= 2px. Filetes de 1px. Mucho aire. El impacto sale del retrato, del nombre y del vuelo; todo lo demás, discreto.

## Estructura de la página (un solo scroll)
1. HERO (#hero): ver abajo. Alto = 100vh (con el nombre recortado abajo).
2. VUELO (#recorrido): escena fijada (pin) con una cámara que avanza por un túnel (CSS 3D + GSAP ScrollTrigger, sin WebGL). 5 estaciones: COBOL (campo de caracteres; lección 'el dinero no es un float'), Spring (Spring Batch por bloques con commit), Rendimiento (pruebas de carga), Full Stack (interfaces, contratos), AI-first ('La IA propone. Yo decido.' con mini diff aceptar/rechazar). Títulos en Instrument Serif cursiva gigante, metadatos mono pequeños, capas de polvo y líneas a 3 profundidades, el garabato SVG reaparece como hilo que une estaciones. **El retrato no aparece durante el vuelo**: al empezar el vuelo se disuelve en polvo de color (lo gobierna `mosaic/portraitScroll.ts`, único escritor del retrato) y no vuelve hasta el cierre. El centro de cada estación queda libre y lo ocupan los gráficos centrales (ver más abajo).
3. CIERRE (#contacto): 'Hablemos.' en cursiva enorme, email con copiar, footer mínimo, 'Volver al inicio'. El retrato reaparece solo aquí, como teselas de color que se re-forman con el scroll; 'Volver al inicio' solo sube (la cara se recompone al subir, por scroll, sin llamar a `reform()`).
4. PRINCIPIOS: modal/panel minimalista accesible con 6 equivalencias (COBOL -> práctica moderna): PIC COMP-3 -> tipos estrictos y validación en los bordes; copybook -> contratos y tipos compartidos; JCL/ventana batch -> colas, jobs idempotentes y CI/CD; pantalla 5250 (campos, F-keys) -> estados de UI, atajos y accesibilidad; journal/auditoría -> observabilidad y trazas; 'si falla de noche, alguien responde' -> operar lo que construyes.

## HERO (la pieza de impacto)
- Canvas 2D a pantalla completa, `position: fixed`, z-index 0, aria-hidden, DETRÁS de todo el contenido, persiste en el DOM durante todo el scroll, pero el retrato solo se ve al inicio (glifos verdes) y al cierre (teselas de color re-formándose con el scroll); en el vuelo está ausente. Su estado es una función pura de la posición de scroll (`portraitScroll.ts`). El lienzo cubre SIEMPRE el viewport entero (sin `transform`/`opacity` CSS que encojan su caja): escala (0.86 en el cierre, origen 50% x / 35% y), `y` y opacidad de la vista las aplica el motor dentro del lienzo. La dispersión (disolverse al inicio del vuelo y re-formación del cierre) tiene destinos absolutos en pantalla, sobre el borde del viewport (+4% del lado mayor), por el rayo ancla-celda con jitter y ~35% sesgado a las esquinas: las celdas salen hacia los bordes y en el cierre llegan desde ellos, como la formación del hero.
- ~6-9k celdas en retícula regular (tamaño de celda adaptativo ~8-11px a 1440; menos celdas en móvil) que forman un BUSTO (cabeza, cuello, hombros) centrado y grande, como en la referencia. Las celdas fuera de la silueta no se dibujan (o apenas polvo muy tenue).
- Al cargar: las celdas arrancan dispersas (posiciones aleatorias lejanas, alpha bajo) y viajan a su celda con retardo escalonado (formación completa en 2-2.5 s, easing suave tipo expo.out), después 'respiran' apenas (desplazamiento de pocos px, NO cambios de brillo globales).
- Materia inicial: glifos de código en verde fósforo (hex 0-9 A-F, `*`, `+`, `=`, `<`, `>`, `X`, `V`, `9`, y bloques ░▒▓█) con brillo según la luminancia del retrato (luz direccional desde arriba-izquierda: un lado más claro, volumen). Cada celda cambia de glifo como mucho cada 1.5-4 s (escalonado, aleatorio, con fundido de ~150ms) para NO producir parpadeo. Nada de scanlines ni flicker.
- Interacción: el puntero repele (polvo magnético) las celdas cercanas con resorte de retorno; en táctil, un toque lanza una onda. Reduced motion: estado final estático, sin puntero.
- Conversión glifo->tesela: `setProgress(p)` 0..1 mueve un frente DIAGONAL: las celdas por delante del frente pasan de glifo verde a tesela cuadrada de color de paleta contenida (hueso, grises fríos, verde señal, turquesa, ámbar; color por celda determinista según luminancia + ruido). Transición por celda de ~300ms, sin parpadeo.
- Vida del rostro final (motor, `liveTiles()`; constantes `LIVE_*` al inicio de `engine.ts`): solo con retrato formado en teselas (`p>=1`, `dis<0.02`), opacidad >= 0.3, sin reduced motion y sin modo de baja potencia (`reductions===0`; si la densidad adaptativa bajó, se apaga). (1) Intercambio de color entre teselas vecinas (radio `LIVE_SWAP_R`, ~2/s): solo si el cambio de brillo de cada celda `|dY| x alfa` <= `LIVE_LUM_TOL` (0.08, ~20/255), niveles de brillo iguales o contiguos y color distinto; fundido lineal ADITIVO (`lighter`, `LIVE_SWAP_FADE` 450 ms: suma premultiplicada = mezcla exacta, sin bache de opacidad). La forma (`lvl`) nunca cambia. (2) Eco del inicio: ~`LIVE_FLIP_FRAC` (2.5%) de las teselas a la vez giran por scaleX (1->0->1, `LIVE_FLIP_MS` 600, sin fundido) y muestran su glifo verde `LIVE_FLIP_HOLD` 700 ms; reparto por acumulador (cuenta estable, celdas al azar, sin oleadas) y `LIVE_FLIP_COOLDOWN` 25 s por celda. El glifo es mas tenue que la tesela (~-2.6% de luminancia media con el estado estacionario; oscilacion medida < 1%). Con el fotograma quieto solo se repintan las celdas activas (`liveTick`); con puntero/vista en movimiento, el dibujo completo normal. Fuera del cierre no hay trabajo ni contadores. Sin escritor nuevo del retrato. `?live=0` (solo pruebas) lo apaga.
- Texto del hero: arriba, 3 microetiquetas en columnas (Actualmente: 'Full Stack Semi Senior, AI-first'; Basado en: 'Ciudad, País (HH:MM)' con hora local viva actualizada cada minuto; Navegación: Recorrido, Principios, Contacto) y marca mínima a la izquierda (monograma sencillo). Abajo a la izquierda, texto breve: 'Del core bancario al producto. COBOL y AS/400 primero; hoy Full Stack Semi Senior, AI-first. Haz scroll para volar por el recorrido.' Abajo a la derecha, botón píldora 'Explorar el recorrido' con flecha en círculo (hover: relleno). Nombre 'Nombre Apellido' gigante en Instrument Serif cursiva (~17vw, ligeramente recortado por el borde inferior, línea de texto única en desktop), h1 real en el DOM, entrada con SplitText cuando el rostro está casi formado. Una línea garabateada a mano (SVG con DrawSVG si existe en la versión de gsap instalada; si no, stroke-dashoffset) que cruza el retrato y se dibuja una vez.

## Contrato entre módulos (propietario único por archivo)
Estructura de la raíz del repo: Vite + React 18 + TS, CSS propio con variables (SIN Tailwind ni librería de UI), gsap + @gsap/react (ScrollTrigger, SplitText, DrawSVGPlugin si están), lenis, fontsource. Sin router.
```
./
  DESIGN.md                    (copia de este documento)
  package.json vite.config.ts index.html tsconfig*.json .gitignore
  src/main.tsx  src/App.tsx
  src/lib/scroll.ts            [A] lenis+gsap, plugins, helpers
  src/mosaic/*                 [A] motor de teselas + API
  src/hero/*                   [A]
  src/styles/tokens.css hero.css   [A]
  src/content.ts               [A] copy y datos (nombre, ciudad, tz, estaciones, principios...) con secciones por módulo
  src/fly/*  src/styles/fly.css    [B]  (A deja stubs)
  src/chrome/*  src/styles/chrome.css  [C] cursor, modal Principios, cierre/contacto, footer, atajos (A deja stubs)
```
API del mosaico (módulo `src/mosaic/api.ts`, singleton accesible desde cualquier módulo; también `window.__mosaic` en dev para pruebas):
- `mosaic.setProgress(p: number)`  0..1 conversión glifo->tesela (frente diagonal). Lo escribe `portraitScroll.ts` a partir del scroll; el vuelo solo le registra dónde empieza el tramo de disolución (`registerAnchors`).
- `mosaic.setView({ scale?: number, y?: number, opacity?: number })`  escala/posición/opacidad del retrato; en el vuelo el retrato ya no se aleja ni se atenúa: se disuelve y está ausente.
- `mosaic.ripple(x: number, y: number)`  onda (clics/toques).
- `mosaic.reform()`  re-dispersa y re-forma el retrato. Ya no se usa para 'Volver al inicio' (esa acción solo hace scroll hacia arriba y la cara se recompone por scroll).
- `mosaic.onFormed(cb)`  se llama cuando la formación inicial termina (A lo usa para el SplitText del nombre).
- `mosaic.setPaused(bool)`  pausa el render cuando el canvas no se ve.
Parámetro de depuración: `?formed=1` salta la formación (solo para pruebas). `?p=0.5` fija el progreso, pero el escritor de scroll de `portraitScroll.ts` lo sobrescribe en cuanto hay scroll, así que no sirve para inspeccionar el vuelo: se prueba posicionando el scroll.
Anclas/ids: `#hero` (A), `#recorrido` (B), `#contacto` (C). Los links de navegación del hero hacen `scrollToTarget('#recorrido'|'#contacto')`; 'Principios' dispara `window.dispatchEvent(new CustomEvent('open-principios'))` (C escucha). Stubs de A: `src/fly/Fly.tsx` (default export, <section id="recorrido">), `src/chrome/Chrome.tsx` (default export; C lo monta en App: cursor, modal, atajos), `src/chrome/Closing.tsx` (default export, <section id="contacto"> + footer). App.tsx renderiza: <Mosaic/> (canvas fijo), <Hero/>, <Fly/>, <Closing/>, <Chrome/>. h1 solo en el hero; los demás titulares h2.
Estado global: `html[data-stage]` no se usa; el color del mundo lo gobierna `mosaic.setProgress`. El cursor y los atajos son de C.

## Gráficos centrales del vuelo (ilustraciones de línea fina)
El centro de cada estación queda vacío porque el retrato no está; tres estaciones lo ocupan con un gráfico `src/fly/Graphics.tsx` (zona `.gx-zone`, entre la columna de texto y la visual, siempre DETRÁS del texto y de las visuales, `pointer-events: none`):
- Estación 1 (COBOL): decimal empaquetado COMP-3. Los 11 dígitos del importe de ejemplo `000012345.67` (`PIC S9(9)V99`) se deslizan de dos en dos a cajas de byte; la `V` (punto decimal implícito) viaja como marcador fino y no ocupa ningún medio byte; el signo `C` aparece al final en el acento. Resultado `00 00 12 34 56 7C`. Pie `PIC S9(9)V99 COMP-3 · 11 dígitos + signo = 6 bytes`, nota `el punto decimal no se guarda` y regla de `columnas 1-80`. La comparación float / COMP-3 (CobolVis) se queda como visual pequeña a la derecha.
- Estación 3 (Rendimiento): la rodilla de la curva. Ejes solo con nombre (`usuarios virtuales` -> `tiempo de respuesta`), rampa de carga, curva plana que se dobla en la rodilla, línea discontinua `umbral`, marcador `rodilla` y, al final, `capacidad antes del límite`. Sustituye a la antigua LoadVis (no hay duplicado).
- Estación 5 (IA): bucle con humano en dos carriles verticales. Desarrollo: Especificación, Pruebas, Propuesta del agente, Contrapropuesta (flecha que vuelve a la propuesta), Aprobación, Integración. Producción: Flujo, Agente con restricciones, compuerta `¿falta información?`, `espera aprobación humana`, `continúa`. Un token recorre los nodos; en la compuerta se detiene hasta pasar un umbral de scroll (un anillo se completa), aparece `aprobado` y sigue.
- Notas de margen (mono pequeño, AA): `columnas 1-80` (estación 1), `commit por bloque` bajo la visual de Spring Batch (estación 2), `umbral` en la línea (estación 3), `aprobación humana` junto al carril de producción (estación 5, solo desde 1280px). Cada gráfico lleva la etiqueta `ilustración` y UNA descripción accesible (`role="img"` + `aria-label` en el `<figure>`); el SVG es `aria-hidden`.
- Reglas: trazo de 1 a 1,25 px al ~0,3-0,55 de opacidad, un solo acento por estación (`--accent`), sin rellenos, sin cifras ni datos inventados (el importe es un ejemplo). SIN bucles ni parpadeo: cada gráfico es una línea de tiempo GSAP pausada cuyo `progress(t)` es función pura del scroll (lineal en px, no de la cámara; ventana de cada estación en 'Ritmo del vuelo'). Reversible y sin estado oculto; fuera de la ventana `t` no cambia y no se escribe nada. Solo `opacity`, transformaciones y `stroke-dashoffset` (DrawSVG).
- Estación 2 (Spring, `MonoGfx.tsx`): 'el monolito bajo la lupa', SVG con línea de tiempo pausada, ventana de scroll según 'Ritmo del vuelo'. Tres tramos: descubrir (t 0,18-0,52: una traza recorre módulos genéricos y un nodo asistente la sigue), medir (0,54-0,70: tres puntos calientes con ring y trama, etiqueta `punto caliente`), optimizar (0,70-1: `recorrido completo` N×N frente a `búsqueda indexada` N con índice, y tres barras del lote que se acortan, sin cifras). Marca del asistente (rótulo `Copilot`, `asistente usado en el proyecto`): visor redondeado con dos ranuras verticales como ojos, línea fina en el acento; se dibuja al empezar y los ojos miran al nodo (posición del ojo = función del punto de la traza, no un bucle) y al final al resultado. El esquema de Spring Batch se retiró para despejar la estación.
- Estación 4 (Full Stack, `TowerGfx.tsx`): 'un inmueble, cuatro superficies', canvas 2D con proyección propia (sin Three.js), ventana de scroll según 'Ritmo del vuelo', `draw(t)` puro y solo cuando cambia `t` (y al cambiar `--accent`). Tramos: construir (0-0,20: siete plantas se dibujan una a una), entorno 3D (0,20-0,52: la órbita, ángulo = f(t) con smoothstep sobre todo su tramo, etiqueta `entorno 3D interactivo`), realidad virtual (0,48-0,78: las lentes se abren de 0,48 a 0,60 y se cierran de 0,67 a 0,78, con paralaje, `realidad virtual`), aplicación web y plataforma (0,76-0,97: se aplana a plano de planta junto a una ficha de inmueble; `aplicación web`, `plataforma de clientes`). El mapa del stack va debajo del gráfico (2 columnas, sin la línea de contexto) y suma Three.js y la fila `Entornos 3D y realidad virtual`.
- Movimiento reducido y móvil (<768px): sin línea de tiempo; el estado DOM por defecto es el cuadro final, dibujado por completo. En móvil el gráfico va en línea bajo el texto (ancho máximo 280-440 px); en escritorio con movimiento reducido ocupa una fila propia bajo texto y visual.

## Ritmo del vuelo
Todo en alturas de ventana (vh = `innerHeight`); la tabla única es `PACE` al inicio de `src/fly/Fly.tsx`. La cámara va por tramos en px (aproximación, y por estación: pausa + viaje con smoothstep); el gráfico de cada estación avanza lineal en px, desacoplado de la cámara, durante `[inicio de la pausa - 0,35·viaje, fin de la pausa]`. En la pausa la cámara solo deriva `creep` = 0,06 unidades de estación (polvo y líneas siguen moviéndose con el scroll; sin scroll no hay movimiento).

Contenedor y margen seguro (escritorio): `--edge = max(5vw, (100vw - 1480px) / 2)` (`fly.css`) sustituye al gutter en `.st-copy`, `.st-vis` y `.gx-zone-*`. La composición (texto + gráfico) queda centrada en cualquier ancho: el texto y el gráfico se pegan a los bordes exteriores del contenedor de 1480 px y el hueco queda en el medio. El 5vw cubre la escala 1,08 de la cámara en pausa y el sobresaliente de la cursiva (nada sale de pantalla al final de la pausa; `.gx-zone-3` arranca a 5,5vh para que el rótulo no salga por arriba). Hueco mínimo entre la columna de texto y el gráfico: `--gap-col = clamp(56px, 4.5vw, 110px)` (`left`/`right` de `.gx-zone-*`; si falta sitio se encoge el gráfico, no se acerca el título). Móvil y movimiento reducido no usan `--edge` ni `--gap-col`.

| Tramo | vh |
|---|---|
| Aproximación (inicio del pin -> estación 1; el retrato termina de disolverse a 0,84) | 1,0 |
| Pausa estación 1 (COMP-3) / 2 (monolito) / 3 (rodilla) / 4 (torre) / 5 (bucle) | 0,6 / 0,9 / 0,6 / 1,3 / 0,9 |
| Viaje entre estaciones (x4) | 0,9 |
| Cola extra en la estación 5 | 0,3 |
| **Pin total** | **9,2** |

- Ventana del gráfico = lead-in (0,35 x 0,9 = 0,315 vh) + pausa: 0,915 / 1,215 / 0,915 / 1,615 / 1,215 vh.
- Hilo: lineal en el scroll del pin, completo a 0,15 vh del final. La disolución del retrato y el cierre se derivan de px (`dissolve` en vh; el cierre sigue anclado a la parte superior de `Closing`). El foco en 'Aceptar' viaja al inicio de la pausa de la estación 5.
- Móvil (<768px) y movimiento reducido: sin pin ni este ritmo.

## Saltos largos (transicion de teselas)
- `scrollToTarget` (src/lib/scroll.ts) es la unica entrada: si la distancia al destino supera `LONG_JUMP` (3) alturas de ventana y no hay movimiento reducido, usa el wipe (`src/lib/wipe.ts`); si no, el scroll suave de siempre. Aplica a 'Volver al inicio', T, C, 'Contacto' del hero y el foco en 'Aceptar' (Fly). Recorrido (~900 px) sigue suave.
- Overlay canvas 2D fijo (`--z-wipe` 150, aria-hidden), creado en el primer uso, oculto y sin rAF en reposo. Rejilla de celdas cuadradas (56-66 px escritorio, ~300 celdas movil), grafito (#181a1e, mas claro que `--bg`) con ~14% teñidas con la paleta del retrato a baja saturacion. Cubre ~0.45 s en diagonal, mantiene ~0.05 s totalmente cubierto (aqui salta el scroll, instantaneo con Lenis `immediate+force`), destapa ~0.55 s en el mismo orden. Celdas a tamano completo con fundido de alfa de ~90 ms (corte en cuadrados nitidos, sin escalado). Sin parpadeo: todo progresivo y por tiempo acumulado (un frame largo nunca salta el progreso).
- Durante el wipe: `inert` en los hijos de `body` (menos el overlay), Lenis parado, rueda/touch/teclas de scroll bloqueados; se restauran siempre al terminar. Peticiones nuevas se ignoran mientras dura. Foco: arriba -> `main#main`; #contacto -> la seccion; salto numerico (Aceptar) -> el mismo boton.
- Al llegar arriba se llama `mosaic.reform()` (la cara verde se forma de nuevo bajo la tapa); en #contacto el retrato ya esta formado por scroll (funcion pura), sin repeticion. Movimiento reducido: sin overlay, salto inmediato.

## Reduced motion, móvil, accesibilidad, rendimiento
- `gsap.matchMedia()` en todo; en reduced motion: sin lenis, sin pin/scrub, sin partículas, retrato final estático (formado y ya convertido a medias o glifos, a decidir), textos completos, vuelo apilado como secciones normales.
- Móvil (<768px): menos celdas (3-4k), sin repulsión (onda al tocar), vuelo sin 3D (apilado con parallax suave), nombre en 2 líneas si hace falta.
- Texto real en DOM, canvas aria-hidden, foco visible, skip link, contraste AA, lang='es', title + meta description.
- Rendimiento: arrays tipados, atlas de glifos offscreen y drawImage por celda, DPR <= 2, número de celdas adaptativo midiendo el tiempo de frame, pausa fuera de pantalla, sin asignaciones por frame.

## Criterios de terminado
Build sin errores TS; 0 errores de consola; sin overflow horizontal; formación en 2-2.5 s sin parpadeo; rAF p95 < 20 ms a 1x; vuelo ida y vuelta consistente (estado puro del scroll); un solo titular visible por posición; modal con foco atrapado y ESC; reduced motion y móvil correctos; capturas revisadas.

## Tono y copy
- Posicionamiento: dominio primero ("Ingeniería de software en banca y servicios financieros"), con la IA como método de todo el ciclo, no como herramienta suelta.
- Registro: tú, coherente. Verbos en primera persona con objeto concreto. Frases de menos de ~25 palabras.
- Prohibido: apasionado/a, autodidacta, en constante aprendizaje, desarrollador web, experto, multidisciplinario sin concretar, y adjetivos sin prueba.
- Sin datos inventados: ni empleadores, fechas ni métricas, ni rieles, normas o regulaciones concretas (Pix, SPEI, Yape, SBS, ISO 20022, PCI DSS...). La única cifra es "más de tres años en software, año y medio en banca".
- La etiqueta de nivel ("Semi Senior") no aparece en el sitio; queda para LinkedIn/CV. "SSR" nunca significa server-side rendering aquí.
- "AI-first" solo va emparejado con responsabilidad humana: la IA propone, yo reviso y respondo por lo que se integra.
- Todo el copy vive en `src/content.ts`; el modal "Principios, método y datos" suma los bloques `chrome.method` y `chrome.datos`.

## Datos reales (reglas vigentes; prevalecen sobre lo anterior si hay conflicto)
- La identidad es Michel Poma, Lima, Perú. Las 5 estaciones del vuelo son el recorrido real: COBOL (Unibanca), Spring (BBVA vía Softtek), Rendimiento (BanBif vía Softtek), Full Stack (Aybar Corp), AI-first. Ya no hay estaciones de AS/400 nocturno ni "El puente".
- Toda afirmación visible debe constar en `CLAIMS.md` (raíz del proyecto) con su fuente y estado. Si añades o cambias copy, actualiza `CLAIMS.md` en el mismo cambio.
- Solo años (por ejemplo "2025 a 2026"), nunca fechas con mes. Los periodos se solapan: no se afirma exclusividad.
- Nunca "fintech" ni años en banca más allá de "año y medio". Fórmula vigente: "más de tres años en software, año y medio en banca"; dominio: "banca y servicios financieros".
- Ningún nombre interno de Aybar (SDK, clientes, flujos): se habla de la clase de sistema.
- Los visuales esquemáticos (Spring Batch, gráficos centrales, mapa del stack, diff) llevan la marca "ilustración" y no contienen cifras ni datos inventados.
- Sin cifras ni logros hasta que existan datos verificables (las 5 preguntas de la sección 9 del CV maestro).
- "La IA propone. Yo decido." describe el flujo de DESARROLLO (criterio propio, contrapropuestas; no es vibe coding). Los agentes en producción son otra cosa: restricciones claras, flujos completos y aprobación humana cuando falta información o no hay una decisión segura.
- Las lecciones (aforismos) son principios ilustrativos, no hechos.


Nota de despliegue: `og:image` y `twitter:image` en index.html son relativas (`/og.png`) y necesitan URL absoluta al conocer el dominio. `public/og.png` (1200x630) se generó con Playwright: rostro formado (`?formed=1&live=0`) más nombre y cargo.

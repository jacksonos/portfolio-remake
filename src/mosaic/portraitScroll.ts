// Unico escritor del estado del retrato (d, p, view): funcion pura del scroll y de las anclas registradas.
// Fly y Closing solo registran donde estan sus tramos; nadie mas llama a mosaic.setDissolve/setProgress/setView.
import { ScrollTrigger } from '../lib/scroll'
import { mosaic } from './api'
import { PH_M } from './engine'

export type Range = [number, number] // scrollY inicial y final
export const CLOSE_OP = 0.42
export const CLOSE_SCALE = 0.86

type Provider = () => Range | null
const src: { dissolve: Provider | null; closing: Provider | null } = { dissolve: null, closing: null }
const A: { dissolve: Range | null; closing: Range | null } = { dissolve: null, closing: null }

const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const ramp = (r: Range, y: number) => (r[1] <= r[0] ? (y >= r[0] ? 1 : 0) : clamp((y - r[0]) / (r[1] - r[0])))

export type Portrait = { d: number; p: number; scale: number; y: number; opacity: number }

/** d: disolverse al inicio del vuelo (0 formado, 1 ido). Cierre: se invierte, ya en modo tesela (p = 1). */
export type HeroView = { scale: number; y: number }
const HERO_VIEW: HeroView = { scale: 1, y: 0 }
// Rostro (pelo a mentón) dentro de la foto, como fracción de su alto. Solo se usa para el inicio móvil.
const FACE: [number, number] = [0.06, 0.63]

/** Inicio movil: escala y desplaza el retrato para que la cara viva en la banda libre entre cabecera y parrafo. */
export function heroViewFor(vw: number, vh: number, bandTop: number, bandBottom: number): HeroView {
  if (vw >= 768 || bandBottom <= bandTop) return HERO_VIEW
  const bh = vh * PH_M[0], top = vh * PH_M[1], voy = vh * 0.35
  const faceH = bh * (FACE[1] - FACE[0])
  const scale = Math.max(0.4, clamp(((bandBottom - bandTop) * 0.96) / faceH))
  // la cara empieza en bandTop (+ aire) tras escalar alrededor de voy
  const y = bandTop - (voy + (top + bh * FACE[0] - voy) * scale)
  return { scale, y }
}

export function portraitAt(y: number, dissolve: Range | null, closing: Range | null, hv: HeroView = HERO_VIEW): Portrait {
  const dd = dissolve ? ramp(dissolve, y) : 0
  const r = closing ? ramp(closing, y) : 0
  if (r > 0) return { d: 1 - r, p: 1, scale: CLOSE_SCALE, y: 0, opacity: CLOSE_OP }
  return { d: dd, p: dd, scale: hv.scale, y: hv.y, opacity: dd >= 1 ? 0 : 1 }
}

let last: Portrait | null = null
function apply() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // movimiento reducido: estados discretos (el cierre cambia en el punto medio de su tramo)
  const c = A.closing && reduced ? ([(A.closing[0] + A.closing[1]) / 2, (A.closing[0] + A.closing[1]) / 2] as Range) : A.closing
  const s = portraitAt(window.scrollY, A.dissolve, c, hero)
  if (last && s.d === last.d && s.p === last.p && s.scale === last.scale && s.y === last.y && s.opacity === last.opacity) return
  last = s
  mosaic.setDissolve(s.d)
  mosaic.setProgress(s.p)
  mosaic.setView({ scale: s.scale, y: s.y, opacity: s.opacity })
}

let hero: HeroView = HERO_VIEW
function measure() {
  // offsetHeight/offsetTop no dependen del scroll (el hero es el primer bloque de la pagina)
  const top = document.querySelector<HTMLElement>('.hero-top')
  const foot = document.querySelector<HTMLElement>('.hero-foot')
  hero = top && foot ? heroViewFor(window.innerWidth, window.innerHeight, top.offsetHeight + 12, foot.offsetTop - 14) : HERO_VIEW
  A.dissolve = src.dissolve?.() ?? null
  A.closing = src.closing?.() ?? null
  apply()
}

let started = false
function start() {
  if (started) return
  started = true
  ScrollTrigger.addEventListener('refresh', measure) // tras recalcular TODOS los triggers (resize, restauracion, fuentes)
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: apply })
}

/** Fly y Closing registran sus tramos (en scrollY); null al desmontar. Devuelve la funcion de baja. */
export function registerAnchors(kind: 'dissolve' | 'closing', p: Provider): () => void {
  start()
  src[kind] = p
  measure()
  return () => {
    if (src[kind] === p) { src[kind] = null; measure() }
  }
}

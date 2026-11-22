// Unico escritor del estado del retrato (d, p, view): funcion pura del scroll y de las anclas registradas.
// Fly y Closing solo registran donde estan sus tramos; nadie mas llama a mosaic.setDissolve/setProgress/setView.
import { ScrollTrigger } from '../lib/scroll'
import { mosaic } from './api'

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
export function portraitAt(y: number, dissolve: Range | null, closing: Range | null): Portrait {
  const dd = dissolve ? ramp(dissolve, y) : 0
  const r = closing ? ramp(closing, y) : 0
  if (r > 0) return { d: 1 - r, p: 1, scale: CLOSE_SCALE, y: 0, opacity: CLOSE_OP }
  return { d: dd, p: dd, scale: 1, y: 0, opacity: dd >= 1 ? 0 : 1 }
}

let last: Portrait | null = null
function apply() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // movimiento reducido: estados discretos (el cierre cambia en el punto medio de su tramo)
  const c = A.closing && reduced ? ([(A.closing[0] + A.closing[1]) / 2, (A.closing[0] + A.closing[1]) / 2] as Range) : A.closing
  const s = portraitAt(window.scrollY, A.dissolve, c)
  if (last && s.d === last.d && s.p === last.p && s.scale === last.scale && s.y === last.y && s.opacity === last.opacity) return
  last = s
  mosaic.setDissolve(s.d)
  mosaic.setProgress(s.p)
  mosaic.setView({ scale: s.scale, y: s.y, opacity: s.opacity })
}

function measure() {
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

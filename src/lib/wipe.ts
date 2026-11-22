// Transicion de teselas a pantalla completa para saltos largos. Solo dibuja mientras esta activa (rAF propio, sin coste en reposo).
// No toca el scroll: recibe `jump` y lo ejecuta con la pantalla totalmente cubierta.
const COVER = 0.45 // s: las celdas aparecen en diagonal
const HOLD = 0.05 // s: cubierto del todo; aqui salta el scroll
const REVEAL = 0.55 // s: desaparecen en el mismo orden
const CELL_DUR = 0.09 // s de fundido de alfa de cada celda (tamano completo desde el primer instante: bordes nitidos)
const MAX_DT = 0.04 // un frame largo (pestana oculta, salto pesado) nunca se salta el progreso

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let active = false
let cw = 0
let ch = 0
let dpr = 1
let cs = 0
let cols = 0
let rows = 0
let start: Float32Array // 0..1 de retraso normalizado de cada celda
let colors: string[] = []
let base = '#181a1e' // grafito mas claro que --bg: la tapa se lee como capa, sin ser un destello

export const isWiping = () => active

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`
}

function build() {
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.className = 'wipe'
    canvas.setAttribute('aria-hidden', 'true')
    document.body.appendChild(canvas)
    ctx = canvas.getContext('2d')
  }
  const w = window.innerWidth
  const h = window.innerHeight
  if (w === cw && h === ch && start) return
  cw = w
  ch = h
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  cs = w < 768 ? Math.max(24, Math.round(Math.sqrt((w * h) / 300))) : Math.max(56, Math.round(w / 22)) // movil ~300 celdas
  cols = Math.ceil(w / cs)
  rows = Math.ceil(h / cs)
  start = new Float32Array(cols * rows)
  const css = getComputedStyle(document.documentElement)
  const v = (n: string) => css.getPropertyValue(n).trim()
  const palette = ['--fg', '--grey1', '--grey2', '--phos', '--cyan', '--amber'].map(v).filter(Boolean)
  colors = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const d = (c / Math.max(1, cols - 1) + r / Math.max(1, rows - 1)) / 2 // diagonal 0..1
      start[i] = Math.min(1, Math.max(0, d * 0.88 + Math.random() * 0.12))
      // ~14% de celdas con un tinte bajo de la paleta del retrato
      colors[i] = palette.length && Math.random() < 0.14 ? mix(base, palette[(Math.random() * palette.length) | 0], 0.08 + Math.random() * 0.08) : base
    }
  }
}

/** Dibuja las celdas a tamano completo con alfa 0..1 segun t dentro de una fase de duracion `dur` (aparecen o se funden en diagonal). */
function draw(t: number, dur: number, grow: boolean, solid: boolean) {
  const g = ctx!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, cw, ch)
  if (solid) {
    g.fillStyle = base
    g.fillRect(0, 0, cw, ch)
  }
  const span = dur - CELL_DUR
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const u = Math.min(1, Math.max(0, (t - start[i] * span) / CELL_DUR))
      const a = grow ? u : 1 - u
      if (a <= 0) continue
      g.globalAlpha = a
      g.fillStyle = colors[i]
      g.fillRect(c * cs, r * cs, cs, cs)
    }
  }
  g.globalAlpha = 1
}

/** Cubre, ejecuta `jump` (instantaneo) con todo cubierto, llama `onReveal` y destapa. Resuelve al terminar. */
export function wipe(jump: () => void, onReveal: () => void): Promise<void> {
  if (active) return Promise.resolve()
  active = true
  build()
  const cv = canvas!
  cv.classList.add('is-on')
  return new Promise<void>((resolve) => {
    let phase: 0 | 1 | 2 = 0
    let el = 0 // tiempo acumulado de la fase
    let last = 0
    let raf = 0
    const end = () => {
      cancelAnimationFrame(raf)
      ctx!.clearRect(0, 0, cw, ch)
      cv.classList.remove('is-on')
      active = false
      resolve()
    }
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      el += last ? Math.min((now - last) / 1000, MAX_DT) : 0
      last = now
      try {
        if (phase === 0) {
          draw(Math.min(el, COVER), COVER, true, false)
          if (el >= COVER) {
            // frame completamente cubierto ya dibujado: el salto queda tapado
            phase = 1
            el = 0
            draw(COVER, COVER, true, true)
            jump()
          }
        } else if (phase === 1) {
          draw(COVER, COVER, true, true)
          if (el >= HOLD) {
            phase = 2
            el = 0
            onReveal()
          }
        } else {
          draw(Math.min(el, REVEAL), REVEAL, false, false)
          if (el >= REVEAL) end()
        }
      } catch (err) {
        end() // nunca dejar la pagina tapada
        throw err
      }
    }
    raf = requestAnimationFrame(frame)
  })
}

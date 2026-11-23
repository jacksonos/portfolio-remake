// Motor del mosaico: retícula regular de celdas, arrays tipados, atlas + drawImage, sin asignaciones por frame.
import { loadPortrait, type PortraitField } from './portrait'
import { buildAtlas, LEVELS, TILE_COLORS, type Atlas } from './glyphs'
import { restoresDeep } from '../lib/restore'

// Formacion (segundos): retardo escalonado + trayecto expo.out
const FORM_DUR = 1.4
const FORM_SPREAD = 0.9
const FORM_TOTAL = FORM_DUR + FORM_SPREAD // 2.3 s
const FIRE_AT = 1.95 // onFormed, justo antes de terminar
const SWAP_FADE = 280 // ms: cambio de glifo suave
const LIVE_FRAC = 0.17 // fraccion de celdas que cambian de glifo
const SWAP_MIN = 3000 // ms entre cambios (3-8 s, desincronizados)
const SWAP_SPAN = 5000
const DIM = 0.3 // opacidad de la vista por debajo de la cual el retrato es tenue
const OFF = 0.02 // por debajo: no se dibuja
const DIM_MS = 40 // ~25 fps con el retrato tenue y sin interaccion
const XFADE_MS = 700 // fundido entre trazados al cambiar la densidad
const P95_UP = 24 // ms: bajar densidad
const P95_OK = 18 // ms: recuperar densidad tras sostenerlo
const RECOVER_MS = 10000
const COOLDOWN_MS = 4000
const MAX_RED = 3
const PHASE_NOISE = 3 // rad: descorrelaciona los saltos de pixel entre celdas vecinas
const CONV_W = 0.22 // ancho del frente diagonal glifo -> tesela (funcion pura de p)
const DIS_SPREAD = 0.35 // escalonado del disolverse entre celdas (0 = todas a la vez)
const DIS_SHRINK = 0.3 // la tesela se encoge hasta este porcentaje al irse
const DIS_K = 5 // pendiente de la curva de dispersion (mayor = mas tiempo cerca del borde)
const DIS_K0 = Math.pow(2, -DIS_K)
const DIS_HOLD = 0.8 // la celda conserva toda su opacidad hasta este t local: llega visible a los bordes
const EDGE_MARGIN = 0.04 // destino de la dispersion: borde del viewport + este margen (x lado mayor)
const CORNER_FRAC = 0.35 // fraccion de celdas cuyo destino se sesga a las esquinas
const POINTER_R = 120
const PUSH = 2.4
const SPRING = 0.045
const RIPPLE_MS = 1500
const MAX_RIPPLES = 4

// Vida del rostro final (cierre): solo con el retrato formado en teselas, visible y sin movimiento reducido.
// 1) intercambio de teselas vecinas  2) eco del inicio: unas pocas teselas se dan la vuelta y muestran su glifo verde.
const LIVE_SWAP_RATE = 3 // intercambios por segundo (todo el rostro, sin patron)
const LIVE_SWAP_FADE = 450 // ms: fundido lineal ADITIVO (suma premultiplicada: sin hundir el brillo a mitad)
const LIVE_SWAP_R = 4 // radio (celdas) en que se busca la pareja
const LIVE_LUM_TOL = 0.08 // |dY| x alfa (0-1) maximo del cambio de brillo de una celda al cambiar de color (~20/255)
const LIVE_FLIP_FRAC = 0.025 // fraccion de teselas girando/mostrando el glifo a la vez (estacionario)
const LIVE_FLIP_MS = 600 // un giro completo scaleX 1 -> 0 -> 1 (tesela -> glifo; la vuelta dura lo mismo)
const LIVE_FLIP_HOLD = 700 // ms mostrando el glifo
const LIVE_FLIP_TOTAL = 2 * LIVE_FLIP_MS + LIVE_FLIP_HOLD
const LIVE_FLIP_COOLDOWN = 25000 // ms hasta que la misma tesela puede girar de nuevo
const TILE_Y = TILE_COLORS.map(([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255)
const tileAlpha = (l: number) => 0.16 + 0.84 * Math.pow(l / (LEVELS - 1), 1.1) // igual que el atlas

export const PH_D = [1.02, 0.04] // foto en escritorio: [alto/vh, top/vh]
export const PH_M = [0.78, 0.09]
const PHOTO_GAMMA = 0.7 // solo foto: estira y sube los medios para que cara y gafas lean en glifo y tesela

const qs = new URLSearchParams(location.search)
const Q_P = qs.get('p')
const Q_FORMED = qs.get('formed') === '1'
const SLOW = Math.max(0.1, Number(qs.get('slow')) || 1) // solo pruebas: dilata la formacion
const ADAPTIVE = qs.get('adaptive') !== '0'
const LIVE_ON = qs.get('live') !== '0' // solo pruebas: apaga la vida del cierre

const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
const fract = (n: number) => n - Math.floor(n)
const hs = (i: number, j: number, s: number) => fract(Math.sin(i * 12.9898 + j * 78.233 + s * 37.719) * 43758.5453)

// ---- estado
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let field: PortraitField | null = null
let atlas: Atlas | null = null
let attached = false
let ready = false
let paused = false
let raf = 0
let last = 0

let dpr = 1
let vw = 0
let vh = 0
let cs = 10
let n = 0
let density = 1
let xfadeT0 = -1e12
let snapCv: HTMLCanvasElement | null = null
let anim = true // hubo cambio no ambiental (formacion, conversion, resorte, onda, fundido)
let ptrT = -1e12 // ultimo movimiento del puntero
let lastDraw = 0
let wasDim = false
let seed = 0
let reduced = false
let touch = false

let formT0 = 0
let formed = false
let fired = false
let swapBase = 0
let prog = 0
let dis = 0 // 0 = formado, 1 = disperso y desvanecido (funcion pura del scroll)
const view = { scale: 1, y: 0, opacity: 1 }
const formedCbs: Array<() => void> = []

let ptrOn = false
let ptrX = 0
let ptrY = 0
const rpX = new Float32Array(MAX_RIPPLES)
const rpY = new Float32Array(MAX_RIPPLES)
const rpT = new Float64Array(MAX_RIPPLES).fill(-1e12)
let rpHead = 0

// celdas
let hx = new Float32Array(0)
let hy = new Float32Array(0)
let sx = new Float32Array(0)
let sy = new Float32Array(0)
let ox = new Float32Array(0)
let oy = new Float32Array(0)
let vx = new Float32Array(0)
let vy = new Float32Array(0)
let ph = new Float32Array(0)
let delay = new Float32Array(0)
let front = new Float32Array(0)
let dvx = new Float32Array(0)
let dvy = new Float32Array(0)
let doff = new Float32Array(0)
let lvl = new Uint8Array(0)
let glyph = new Uint8Array(0)
let prev = new Uint8Array(0)
let cls = new Uint8Array(0)
let live = new Uint8Array(0)
let tile = new Uint8Array(0)
let swapT = new Float64Array(0)
let nextSwap = new Float64Array(0)
let tprev = new Uint8Array(0) // color de tesela anterior (fundido del intercambio)
let tileT = new Float64Array(0) // inicio del ultimo intercambio de color
let flipT = new Float64Array(0) // inicio del ultimo giro
let gidx = new Int32Array(0) // reticula (i,j) -> celda, -1 si vacia
let gci = 0
let swapAcc = 0
let flipAcc = 0
let liveSwaps = 0
let liveFlips = 0
let flipActive = 0
let liveOnNow = false
let canvasFull = false // el lienzo guarda un fotograma completo y quieto: la vida del cierre solo repinta las celdas activas
let actIdx = new Int32Array(0) // celdas con intercambio o giro en curso
let actN = 0

// frame stats / densidad adaptativa
const RING = 150
const ring = new Float32Array(RING)
const scratch = new Float32Array(RING)
let ringN = 0
let skipFrames = 0
let lastP95 = 0
let reductions = 0
let lastChange = -1e12
let goodSince = 0
let recoverWait = RECOVER_MS
let lastRecover = -1e12

// ---- muestreo del retrato en la retícula
let bw = 0, bh = 0, left = 0, top = 0
let sM = 0, sL = 0
function sampleAt(x: number, y: number) {
  const f = field!
  const u = (x - left) / bw, v = (y - top) / bh
  if (u < 0 || u >= 1 || v < 0 || v >= 1) { sM = 0; sL = 0; return }
  const k = Math.floor(v * f.height) * f.width + Math.floor(u * f.width)
  sM = f.mask[k]
  sL = f.lum[k]
}

function scan(size: number, emit: ((i: number, j: number, lum: number, dust: boolean) => void) | null): number {
  const ci = Math.ceil(vw / size), cj = Math.ceil(vh / size)
  let c = 0
  const q = size * 0.25
  for (let j = 0; j < cj; j++)
    for (let i = 0; i < ci; i++) {
      const x = (i + 0.5) * size, y = (j + 0.5) * size
      let m = 0, lw = 0
      if (x > left - size && x < left + bw + size && y > top - size && y < top + bh + size) {
        sampleAt(x - q, y - q); m += sM; lw += sL * sM
        sampleAt(x + q, y - q); m += sM; lw += sL * sM
        sampleAt(x - q, y + q); m += sM; lw += sL * sM
        sampleAt(x + q, y + q); m += sM; lw += sL * sM
      }
      // borde inferior del lienzo: el busto se disuelve (celdas salteadas + menos luz) en vez de un corte plano
      const ew = clamp((vh - y) / (vh * 0.15))
      const fe = ew * ew * (3 - 2 * ew)
      // foto: cobertura del alfa como probabilidad (los hombros difuminados se disuelven sin corte plano)
      const inside = field!.photo ? m * 0.25 >= hs(i, j, 17.7) * 0.98 + 0.01 : m >= 2
      if (inside && fe >= hs(i, j, 12.3)) {
        c++
        emit?.(i, j, (lw / m) * (0.35 + 0.65 * fe), false)
      } else if (hs(i, j, 3.3) < 0.011) {
        c++
        emit?.(i, j, 0.05, true) // polvo muy tenue
      }
    }
  return c
}

function build(crossfade = false) {
  if (!canvas || !field) return
  // instantanea del lienzo actual: se funde a la nueva retícula sin salto visible
  let keep = false
  if (crossfade && formed && n > 0 && canvas.width > 0) {
    snapCv ??= document.createElement('canvas')
    snapCv.width = canvas.width
    snapCv.height = canvas.height
    snapCv.getContext('2d')!.drawImage(canvas, 0, 0)
    keep = true
  }
  vw = window.innerWidth
  vh = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (keep && (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr))) keep = false
  canvas.width = Math.round(vw * dpr)
  canvas.height = Math.round(vh * dpr)
  xfadeT0 = keep ? performance.now() : -1e12
  const mobile = vw < 768
  // foto: cuadrada, cabeza ~ del tamano del busto y hombros que sangran por abajo
  const photo = !!field.photo
  bh = photo ? (mobile ? vh * PH_M[0] : vh * PH_D[0]) : mobile ? vh * 0.85 : vh * 1.12
  top = photo ? (mobile ? vh * PH_M[1] : vh * PH_D[1]) : mobile ? vh * 0.08 : vh * 0.04
  bw = (bh * field.width) / field.height
  left = (vw - bw) / 2
  const target = (mobile ? 3500 : 6400) * density

  let size = 10
  for (let k = 0; k < 3; k++) size = clamp(size * Math.sqrt(scan(size, null) / target), 5, 18)
  cs = Math.max(5, Math.round(size * dpr)) / dpr // entero en px de dispositivo: reticula sin costuras
  n = scan(cs, null)

  hx = new Float32Array(n); hy = new Float32Array(n); sx = new Float32Array(n); sy = new Float32Array(n)
  ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n)
  ph = new Float32Array(n); delay = new Float32Array(n); front = new Float32Array(n)
  dvx = new Float32Array(n); dvy = new Float32Array(n); doff = new Float32Array(n)
  lvl = new Uint8Array(n); glyph = new Uint8Array(n); prev = new Uint8Array(n)
  cls = new Uint8Array(n); live = new Uint8Array(n); tile = new Uint8Array(n)
  swapT = new Float64Array(n).fill(-1e12); nextSwap = new Float64Array(n)
  actIdx = new Int32Array(n); actN = 0; canvasFull = false
  tprev = new Uint8Array(n); tileT = new Float64Array(n).fill(-1e12); flipT = new Float64Array(n).fill(-1e12)
  gci = Math.ceil(vw / cs)
  gidx = new Int32Array(gci * Math.ceil(vh / cs)).fill(-1)

  atlas = buildAtlas(cs * dpr)
  const CL = atlas.classes
  const cx0 = left + bw / 2, cy0 = top + bh * 0.33
  const vmax = Math.max(vw, vh)
  const mg = vmax * EDGE_MARGIN
  let idx = 0
  scan(cs, (i, j, lum, dust) => {
    const k = idx++
    const x = (i + 0.5) * cs, y = (j + 0.5) * cs
    hx[k] = x; hy[k] = y
    gidx[j * gci + i] = k
    ph[k] = hs(i, j, 4.4) * PHASE_NOISE
    const a = Math.atan2(y - cy0, x - cx0) + (hs(i, j, seed + 1.1) - 0.5) * 1.6
    const r = 220 + hs(i, j, seed + 2.2) * vmax * 0.8
    sx[k] = x + Math.cos(a) * r
    sy[k] = y + Math.sin(a) * r
    // dispersion determinista (hash de la celda): direccion radial + giro, profundidad propia (paralaje)
    // destino en PANTALLA: sobre el borde del viewport (+margen), por el rayo desde el ancla que pasa por la celda;
    // una parte se sesga hacia las esquinas. Es una posicion absoluta (no un vector): llega a los bordes en cualquier vista.
    let ad = Math.atan2(y - cy0, x - cx0) + (hs(i, j, 22.2) - 0.5) * 0.9
    if (hs(i, j, 21.1) < CORNER_FRAC) {
      const qx = x < cx0 ? -mg : vw + mg, qy = y < cy0 ? -mg : vh + mg
      ad = Math.atan2(qy - cy0, qx - cx0) + (hs(i, j, 23.3) - 0.5) * 0.35
    }
    const ux = Math.cos(ad), uy = Math.sin(ad)
    const tx = ux > 1e-4 ? (vw + mg - cx0) / ux : ux < -1e-4 ? (-mg - cx0) / ux : 1e9
    const ty = uy > 1e-4 ? (vh + mg - cy0) / uy : uy < -1e-4 ? (-mg - cy0) / uy : 1e9
    const tt = Math.min(tx, ty) * (1 + 0.12 * hs(i, j, 25.5))
    dvx[k] = cx0 + ux * tt
    dvy[k] = cy0 + uy * tt
    const dn = clamp(Math.hypot(x - cx0, y - cy0) / (bh * 0.8))
    delay[k] = (0.62 * hs(i, j, seed + 3.3) + 0.38 * dn) * FORM_SPREAD
    front[k] = clamp((x / vw + y / vh) / 2 + (hs(i, j, 5.5) - 0.5) * 0.06)
    doff[k] = 0.3 * front[k] + 0.7 * hs(i, j, 24.4)
    const l = field!.photo && !dust ? Math.pow(clamp((lum - 0.08) / 0.72), PHOTO_GAMMA) : clamp(lum)
    lvl[k] = dust ? 0 : Math.min(LEVELS - 1, Math.floor(Math.pow(clamp((l - 0.08) / 0.88), 1.05) * LEVELS))
    const p = l < 0.28 ? 0 : l < 0.6 ? 1 : 2
    cls[k] = p
    const pl = CL[p]
    glyph[k] = pl[Math.floor(hs(i, j, 6.6) * pl.length)]
    live[k] = hs(i, j, 7.7) < LIVE_FRAC ? 1 : 0
    if (p === 2 && !dust && hs(i, j, 13.1) < 0.17) {
      glyph[k] = atlas!.heavy[hs(i, j, 14.2) < 0.5 ? 0 : 1] // bloque fijo en las zonas claras
      live[k] = 0
    }
    prev[k] = glyph[k]
    nextSwap[k] = swapBase + hs(i, j, 8.8) * (SWAP_MIN + SWAP_SPAN)
    // tesela: determinista por luminancia + ruido
    const h = hs(i, j, 9.9)
    tile[k] = !dust && l > 0.15 && h < 0.045 ? (h < 0.016 ? 4 : h < 0.03 ? 5 : 3) : l > 0.6 ? 0 : l > 0.33 ? 1 : 2
    tprev[k] = tile[k]
  })

  ringN = 0
  skipFrames = 30
  anim = true
  applyView()
}

// ---- API interna
// El lienzo cubre SIEMPRE el viewport entero: escala/desplazamiento/opacidad de la vista se aplican dentro de draw()
// (origen 50% x, 35% y del viewport) para poder dibujar celdas en cualquier punto de la pantalla.
function applyView() {
  anim = true
  if (view.opacity < OFF && ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export function setProgress(p: number) {
  const v = clamp(p)
  if (v !== prog) { prog = v; anim = true }
}
/** 0 = retrato formado, 1 = disperso y desvanecido (no se dibuja nada). */
export function setDissolve(d: number) {
  const v = clamp(d)
  if (v === dis) return
  dis = v
  anim = true
  if (v >= 1 && ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
}
export function setView(v: { scale?: number; y?: number; opacity?: number }) {
  if (v.scale !== undefined) view.scale = v.scale
  if (v.y !== undefined) view.y = v.y
  if (v.opacity !== undefined) view.opacity = v.opacity
  applyView()
  syncLoop() // pausa/reanuda segun la opacidad
}
export function ripple(x: number, y: number) {
  if (reduced) return
  rpX[rpHead] = x; rpY[rpHead] = y; rpT[rpHead] = performance.now()
  rpHead = (rpHead + 1) % MAX_RIPPLES
  anim = true
}
export function reform() {
  if (!ready) return
  seed = Math.random() * 100
  formT0 = performance.now()
  swapBase = formT0 + FORM_TOTAL * 1000 * SLOW
  formed = false
  fired = false
  if (reduced) formT0 = -1e12
  build()
}
export function onFormed(cb: () => void): () => void {
  if (formed || fired) { queueMicrotask(cb); return () => {} }
  formedCbs.push(cb)
  return () => { const i = formedCbs.indexOf(cb); if (i >= 0) formedCbs.splice(i, 1) }
}
export function setPaused(p: boolean) {
  paused = p
  syncLoop()
}
export function stats() {
  return { cells: n, cellSize: cs, dpr, formed, formT0, density, p95: lastP95, reductions, progress: prog, dissolve: dis, running: raf !== 0, opacity: view.opacity, scale: view.scale, live: liveOnNow, liveSwaps, liveFlips, flipActive }
}

// ---- bucle
// al reanudar tras una pausa larga: sin esto todas las celdas vivas con el turno vencido cambiarian de glifo a la vez
function rescheduleSwaps(now: number) {
  for (let i = 0; i < n; i++) nextSwap[i] = now + Math.random() * (SWAP_MIN + SWAP_SPAN)
}

// vida del cierre: solo con el rostro formado en teselas, visible, sin movimiento reducido y sin modo de baja potencia
const liveTiles = () => LIVE_ON && formed && !reduced && prog >= 1 && dis < 0.02 && view.opacity >= DIM && reductions === 0

const tileBusy = (i: number, now: number) => now - tileT[i] < LIVE_SWAP_FADE || now - flipT[i] < LIVE_FLIP_TOTAL
function trySwap(now: number) {
  for (let a = 0; a < 60; a++) {
    const i = (Math.random() * n) | 0
    if (lvl[i] < 1 || tileBusy(i, now)) continue
    const gx = Math.floor(hx[i] / cs) + ((Math.random() * (2 * LIVE_SWAP_R + 1)) | 0) - LIVE_SWAP_R
    const gy = Math.floor(hy[i] / cs) + ((Math.random() * (2 * LIVE_SWAP_R + 1)) | 0) - LIVE_SWAP_R
    if (gx < 0 || gx >= gci || gy < 0) continue
    const j = gidx[gy * gci + gx]
    if (j < 0 || j === i || tile[j] === tile[i] || lvl[j] < 1 || Math.abs(lvl[j] - lvl[i]) > 1 || tileBusy(j, now)) continue
    const dY = Math.abs(TILE_Y[tile[i]] - TILE_Y[tile[j]])
    if (dY * Math.max(tileAlpha(lvl[i]), tileAlpha(lvl[j])) > LIVE_LUM_TOL) continue
    tprev[i] = tile[i]; tprev[j] = tile[j]
    const t = tile[i]; tile[i] = tile[j]; tile[j] = t
    tileT[i] = tileT[j] = now
    if (actN + 2 <= n) { actIdx[actN++] = i; actIdx[actN++] = j }
    liveSwaps++
    return
  }
}
function tryFlip(now: number) {
  for (let a = 0; a < 8; a++) {
    const i = (Math.random() * n) | 0
    if (lvl[i] < 1 || tileBusy(i, now) || now - flipT[i] < LIVE_FLIP_TOTAL + LIVE_FLIP_COOLDOWN) continue
    flipT[i] = now
    if (actN < n) actIdx[actN++] = i
    liveFlips++
    return
  }
}

const cellActive = (i: number, now: number) => now - flipT[i] < LIVE_FLIP_TOTAL || now - tileT[i] < LIVE_SWAP_FADE

function liveSpawn(now: number, dt: number) {
  swapAcc = Math.min(swapAcc + (LIVE_SWAP_RATE * dt) / 1000, 4)
  flipAcc = Math.min(flipAcc + (LIVE_FLIP_FRAC * n * dt) / LIVE_FLIP_TOTAL, 40)
  while (swapAcc >= 1) { swapAcc--; trySwap(now) }
  while (flipAcc >= 1) { flipAcc--; tryFlip(now) }
}

// una tesela con vida (giro o fundido de intercambio), en la caja (x, y, w, h) en px de dispositivo
function liveTile(i: number, now: number, x: number, y: number, w: number, h: number, alpha: number) {
  const g = ctx!, S = atlas!.s, col = lvl[i] * S
  const t = now - flipT[i]
  let face = 0, sxf = 1
  if (t < LIVE_FLIP_TOTAL) {
    const H = LIVE_FLIP_MS / 2
    flipActive++
    // giro por escala horizontal, sin fundido: tesela 1->0, glifo 0->1, pausa, glifo 1->0, tesela 0->1
    if (t < H) sxf = Math.cos((t / H) * 1.5708)
    else if (t < 2 * H) { face = 1; sxf = Math.sin(((t - H) / H) * 1.5708) }
    else if (t < 2 * H + LIVE_FLIP_HOLD) face = 1
    else if (t < 3 * H + LIVE_FLIP_HOLD) { face = 1; sxf = Math.cos(((t - 2 * H - LIVE_FLIP_HOLD) / H) * 1.5708) }
    else sxf = Math.sin(((t - 3 * H - LIVE_FLIP_HOLD) / H) * 1.5708)
  }
  g.globalAlpha = alpha
  if (face || sxf < 1) {
    const ww = w * sxf
    if (ww >= 0.5) g.drawImage(face ? atlas!.glyph : atlas!.tile, col, (face ? glyph[i] : tile[i]) * S, S, S, x + (w - ww) * 0.5, y, ww, h)
    return
  }
  const tf = (now - tileT[i]) / LIVE_SWAP_FADE
  if (tf < 1) {
    // aditivo: la suma premultiplicada es una mezcla lineal exacta, sin bache de opacidad a mitad del fundido
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = alpha * (1 - tf)
    g.drawImage(atlas!.tile, col, tprev[i] * S, S, S, x, y, w, h)
    g.globalAlpha = alpha * tf
    g.drawImage(atlas!.tile, col, tile[i] * S, S, S, x, y, w, h)
    g.globalCompositeOperation = 'source-over'
  } else g.drawImage(atlas!.tile, col, tile[i] * S, S, S, x, y, w, h)
}

function pruneActive(now: number) {
  let m = 0
  for (let k = 0; k < actN; k++) if (cellActive(actIdx[k], now)) actIdx[m++] = actIdx[k]
  actN = m
}

// fotograma quieto del cierre: repinta SOLO las celdas con vida sobre el lienzo ya pintado (misma geometria de reposo que draw())
function liveTick(now: number, dt: number) {
  const g = ctx!, S = atlas!.s
  const vsc = view.scale, vox = vw / 2, voy = vh * 0.35
  flipActive = 0
  let m = 0
  for (let k = 0; k < actN; k++) {
    const i = actIdx[k]
    const rx = vox + (hx[i] - vox) * vsc, ry = voy + (hy[i] - voy) * vsc + view.y
    const lx = rx * dpr - S * vsc * 0.5, ly = ry * dpr - S * vsc * 0.5
    const l0 = Math.round(lx), t0 = Math.round(ly)
    const sz = Math.round(lx + S * vsc) - l0, sh = Math.round(ly + S * vsc) - t0
    g.globalAlpha = 1
    g.clearRect(l0, t0, sz, sh)
    liveTile(i, now, l0, t0, sz, sh, view.opacity)
    if (cellActive(i, now)) actIdx[m++] = i
  }
  actN = m
  g.globalAlpha = 1
  liveSpawn(now, dt) // las nuevas empiezan a verse en el siguiente tick
}

function syncLoop() {
  const run = ready && !paused && !document.hidden && view.opacity >= OFF
  if (run && !raf) { last = performance.now(); rescheduleSwaps(last); skipFrames = 5; ringN = 0; anim = true; raf = requestAnimationFrame(frame) }
  if (!run && raf) { cancelAnimationFrame(raf); raf = 0 }
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dim = view.opacity < DIM
  if (dim !== wasDim) { wasDim = dim; skipFrames = 6; ringN = 0 }
  const interacting = now - ptrT < 600 || anim
  // retrato tenue y sin cambios: ~25 fps; con movimiento reducido y sin cambios: no se redibuja
  if (!interacting && ready) {
    if (reduced) return
    const live = liveTiles()
    if (formed && prog >= 1 && !live) return // todo en tesela y quieto (cierre): nada ambiental se mueve
    if (dim && now - lastDraw < DIM_MS) return
    if (live && canvasFull) { // cierre quieto: solo celdas activas, sin redibujar el rostro
      const dtl = Math.min(now - last, 100)
      last = now
      liveOnNow = true
      liveTick(now, dtl)
      return
    }
  }
  const dt = Math.min(now - last, 100)
  last = now
  lastDraw = now
  const throttled = dim && !interacting
  if (skipFrames > 0) skipFrames--
  else if (ADAPTIVE && formed && !throttled && !dim) {
    ring[ringN++] = dt
    if (ringN === RING) {
      scratch.set(ring)
      scratch.sort()
      lastP95 = scratch[Math.floor(RING * 0.95)]
      ringN = 0
      if (lastP95 > P95_UP && reductions < MAX_RED && !reduced && now - lastChange > COOLDOWN_MS) {
        // una bajada poco despues de una subida: la proxima subida espera el doble (sin oscilar)
        if (now - lastRecover < 30000) recoverWait = Math.min(recoverWait * 2, 80000)
        reductions++
        density = Math.pow(0.8, reductions)
        lastChange = now
        goodSince = 0
        build(true)
        return
      }
      if (lastP95 < P95_OK) {
        if (!goodSince) goodSince = now - 2500 // la ventana medida ya cuenta
        if (reductions > 0 && now - goodSince >= recoverWait && now - lastChange >= recoverWait) {
          reductions--
          density = Math.pow(0.8, reductions)
          lastChange = lastRecover = now
          goodSince = now // sigue sano: el siguiente paso espera solo recoverWait
          build(true)
          return
        }
      } else goodSince = 0
    }
  }
  draw(now, dt)
}

function fireFormed() {
  fired = true
  const cbs = formedCbs.splice(0)
  for (const cb of cbs) cb()
}

function draw(now: number, dt: number) {
  const g = ctx!, at = atlas!
  const S = at.s
  const cw = canvas!.width, ch = canvas!.height
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, cw, ch)

  if (dis >= 1) { anim = false; return } // sin retrato: nada que dibujar

  const ft = (now - formT0) / 1000 / SLOW
  const forming = ft < FORM_TOTAL
  if (!fired && ft >= FIRE_AT) fireFormed()
  if (!forming) formed = true
  const f60 = Math.min(dt / 16.667, 3)
  const thr = prog * (1 + CONV_W)
  const dOn = dis > 0
  const breath = reduced ? 0 : clamp((ft - 1.8) / 1.2) * 0.65
  const swapOn = formed && !reduced
  const liveOn = liveTiles()
  liveOnNow = liveOn
  flipActive = 0
  if (liveOn) liveSpawn(now, dt)
  else { swapAcc = 0; flipAcc = 0 }
  const damp = 1 - 0.14 * f60

  // vista: escala/y/opacidad aplicadas aqui (origen 50% x, 35% y); el lienzo siempre cubre el viewport
  const vsc = view.scale, vy0 = view.y, vop = view.opacity
  const vox = vw / 2, voy = vh * 0.35
  // puntero en coordenadas de la retícula (deshace escala/translacion de la vista)
  const pa = ptrOn && !reduced && !touch && dis < 0.01
  let pX = 0, pY = 0
  if (pa) {
    pX = vox + (ptrX - vox) / vsc
    pY = voy + (ptrY - voy - vy0) / vsc
  }
  const rad2 = POINTER_R * POINTER_R
  let nRip = 0
  for (let r = 0; r < MAX_RIPPLES; r++) if (now - rpT[r] < RIPPLE_MS) nRip++

  const sA = at.glyph, tA = at.tile, CL = at.classes
  const wallBreathT = now * 0.00031, wallBreathT2 = now * 0.00026
  let lastAlpha = -1
  let moved = forming
  const xk = clamp((now - xfadeT0) / XFADE_MS) // 0..1 fundido de la retícula nueva
  const xf = xk < 1
  if (xf || nRip > 0) moved = true

  for (let i = 0; i < n; i++) {
    let e = 1
    if (forming) {
      const t = (ft - delay[i]) / FORM_DUR
      if (t <= 0) continue
      e = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    // conversion por celda: funcion pura de p (frente diagonal con ancho CONV_W)
    const c = clamp((thr - front[i]) / CONV_W)

    // disolverse: t local por celda (escalonado), 0 = en su sitio, 1 = lejos y desvanecida
    let tl = 0, te = 0
    if (dOn) {
      tl = clamp((dis - DIS_SPREAD * doff[i]) / (1 - DIS_SPREAD))
      // expo invertida (como la formacion del hero, al reves): el grueso del trayecto ocurre cerca de los bordes
      te = (Math.pow(2, -DIS_K * (1 - tl)) - DIS_K0) / (1 - DIS_K0)
      if (tl >= 1) continue
    }

    // fisica del puntero (solo celdas ya asentadas)
    let ox_ = ox[i], oy_ = oy[i]
    if (pa && e >= 1) {
      const dx = hx[i] + ox_ - pX, dy = hy[i] + oy_ - pY
      const d2 = dx * dx + dy * dy
      if (d2 < rad2 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        let s = 1 - d / POINTER_R
        s *= s
        vx[i] += (dx / d) * s * PUSH * f60
        vy[i] += (dy / d) * s * PUSH * f60
      }
    }
    if (ox_ !== 0 || oy_ !== 0 || vx[i] !== 0 || vy[i] !== 0) {
      let vx_ = vx[i], vy_ = vy[i]
      vx_ = (vx_ - SPRING * ox_ * f60) * damp
      vy_ = (vy_ - SPRING * oy_ * f60) * damp
      ox_ += vx_ * f60
      oy_ += vy_ * f60
      if (Math.abs(ox_) < 0.03 && Math.abs(vx_) < 0.03) { ox_ = 0; vx_ = 0 }
      if (Math.abs(oy_) < 0.03 && Math.abs(vy_) < 0.03) { oy_ = 0; vy_ = 0 }
      ox[i] = ox_; oy[i] = oy_; vx[i] = vx_; vy[i] = vy_
      moved = true
    }

    let x = hx[i] + ox_
    let y = hy[i] + oy_
    if (forming) {
      x += (sx[i] - hx[i]) * (1 - e)
      y += (sy[i] - hy[i]) * (1 - e)
    }
    if (breath > 0 && c < 1) {
      // las teselas ya convertidas no respiran: evita costuras moviles en el mosaico
      const b = breath * (1 - c)
      // ondas transversales (sin divergencia): las celdas se desplazan sin comprimirse ni solaparse,
      // asi la tinta total del lienzo no oscila con la respiracion
      const s1 = Math.sin(wallBreathT + ph[i] + hx[i] * 0.011 + hy[i] * 0.008) * b
      const s2 = Math.sin(wallBreathT2 + ph[i] - hx[i] * 0.006 + hy[i] * 0.012) * b * 0.7
      x += -0.588 * s1 - 0.894 * s2
      y += 0.809 * s1 - 0.447 * s2
    }
    if (nRip > 0) {
      for (let r = 0; r < MAX_RIPPLES; r++) {
        const age = now - rpT[r]
        if (age >= RIPPLE_MS) continue
        const dx = hx[i] - rpX[r], dy = hy[i] - rpY[r]
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01
        const w = 1 - Math.abs(d - age * 0.7) / 80
        if (w > 0) {
          const amp = 16 * (1 - age / RIPPLE_MS) * w * w
          x += (dx / d) * amp
          y += (dy / d) * amp
        }
      }
    }

    // vista (escala alrededor del ancla) y dispersion en pantalla: la celda va de su reposo escalado a su destino absoluto
    const rx = vox + (hx[i] - vox) * vsc, ry = voy + (hy[i] - voy) * vsc + vy0
    x = vox + (x - vox) * vsc
    y = voy + (y - voy) * vsc + vy0
    if (dOn) {
      x += (dvx[i] - rx) * te
      y += (dvy[i] - ry) * te
    }
    // reposo en pixel entero fijo (bordes redondeados: sin costuras con escala) + desplazamiento redondeado: los micro-movimientos no saltan de pixel
    const lx = rx * dpr - S * vsc * 0.5, ly = ry * dpr - S * vsc * 0.5
    const l0 = Math.round(lx), t0 = Math.round(ly)
    const dxp = l0 + Math.round((x - rx) * dpr)
    const dyp = t0 + Math.round((y - ry) * dpr)
    let sz = Math.round(lx + S * vsc) - l0
    const szy = Math.round(ly + S * vsc) - t0
    if (dxp < -S || dyp < -S || dxp > cw || dyp > ch) continue

    let a = (forming ? 0.15 + 0.85 * e : 1) * (xf ? xk : 1) * vop
    let dx0 = dxp, dy0 = dyp, sh = szy
    if (dOn) {
      const f = tl < DIS_HOLD ? 1 : 1 - (tl - DIS_HOLD) / (1 - DIS_HOLD)
      a *= f * f * (3 - 2 * f)
      const k = 1 - DIS_SHRINK * te
      dx0 = dxp + sz * (1 - k) * 0.5
      dy0 = dyp + sh * (1 - k) * 0.5
      sz *= k
      sh *= k
    }
    // el turno de cambio avanza aunque la celda sea tesela: al volver al glifo no cambian todas a la vez
    if (swapOn && now >= nextSwap[i]) {
      nextSwap[i] = now + SWAP_MIN + Math.random() * SWAP_SPAN
      if (live[i]) {
        const pl = CL[cls[i]]
        if (pl.length > 1) {
          prev[i] = glyph[i]
          let g2 = pl[Math.floor(Math.random() * pl.length)]
          if (g2 === glyph[i]) g2 = pl[(pl.indexOf(g2) + 1) % pl.length]
          glyph[i] = g2
          swapT[i] = now
        }
      }
    }
    const row = glyph[i] * S
    const col = lvl[i] * S
    const ga = a * (1 - c)
    if (ga > 0.004) {
      let fade = 1
      if (swapOn) fade = (now - swapT[i]) / SWAP_FADE
      if (fade < 1) {
        const pa_ = ga * (1 - fade)
        if (pa_ !== lastAlpha) { g.globalAlpha = pa_; lastAlpha = pa_ }
        g.drawImage(sA, col, prev[i] * S, S, S, dx0, dy0, sz, sh)
        const na = ga * fade
        if (na !== lastAlpha) { g.globalAlpha = na; lastAlpha = na }
        g.drawImage(sA, col, row, S, S, dx0, dy0, sz, sh)
      } else {
        if (ga !== lastAlpha) { g.globalAlpha = ga; lastAlpha = ga }
        g.drawImage(sA, col, row, S, S, dx0, dy0, sz, sh)
      }
    }
    if (c > 0.004) {
      const tA_ = a * c
      if (liveOn && cellActive(i, now)) { liveTile(i, now, dx0, dy0, sz, sh, tA_); lastAlpha = -1 }
      else {
        if (tA_ !== lastAlpha) { g.globalAlpha = tA_; lastAlpha = tA_ }
        g.drawImage(tA, col, tile[i] * S, S, S, dx0, dy0, sz, sh)
      }
    }
  }
  g.globalAlpha = 1
  if (xf && snapCv) {
    // 'lighter': suma la retícula vieja (1-k) a la nueva (k) sin hundir el brillo a mitad del fundido
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 1 - xk
    g.drawImage(snapCv, 0, 0)
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 1
  }
  anim = moved
  canvasFull = liveOn && !moved && !dOn && !forming && !xf
  if (liveOn) pruneActive(now)
}

// ---- ciclo de vida
const fontsReady = () =>
  Promise.race([
    document.fonts?.load('600 16px "Geist Mono Variable"') ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ])

let resizeT = 0
function onResize() {
  clearTimeout(resizeT)
  resizeT = window.setTimeout(() => {
    if (!ready) return
    if (window.innerWidth !== vw || Math.abs(window.innerHeight - vh) > 80) build()
  }, 180)
}
function onMove(e: PointerEvent) {
  if (e.pointerType === 'touch') return
  ptrOn = true
  ptrT = performance.now()
  ptrX = e.clientX
  ptrY = e.clientY
}
function onDown(e: PointerEvent) {
  if (e.pointerType === 'touch') ripple(e.clientX, e.clientY)
}
const onLeave = () => { ptrOn = false }
const onVis = () => syncLoop()
const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
const onMq = () => { reduced = mq.matches }

async function init() {
  const [f] = await Promise.all([loadPortrait(), fontsReady()])
  if (!attached) return
  field = f
  const now = performance.now()
  const skipForm = reduced || Q_FORMED || restoresDeep() // restaurado bajo el hero: ya formado
  formT0 = skipForm ? -1e12 : now
  swapBase = skipForm ? now : formT0 + FORM_TOTAL * 1000 * SLOW
  if (Q_P !== null) prog = clamp(Number(Q_P) || 0)
  build()
  ready = true
  syncLoop()
}

export function attach(c: HTMLCanvasElement): () => void {
  canvas = c
  ctx = c.getContext('2d', { alpha: true })!
  attached = true
  reduced = mq.matches
  touch = window.matchMedia('(hover: none), (pointer: coarse)').matches
  window.addEventListener('resize', onResize)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
  document.addEventListener('visibilitychange', onVis)
  mq.addEventListener('change', onMq)
  if (field) { build(); ready = true; syncLoop() } else void init()
  applyView()
  return () => {
    attached = false
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onDown)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
    document.removeEventListener('visibilitychange', onVis)
    mq.removeEventListener('change', onMq)
    if (raf) { cancelAnimationFrame(raf); raf = 0 }
    ready = false
    canvas = null
    ctx = null
  }
}

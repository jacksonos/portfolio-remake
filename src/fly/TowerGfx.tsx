import { useLayoutEffect, useRef } from 'react'
import { fly } from '../content'
import { pad, tline, type TL } from './Graphics'
import { StackVis } from './Visuals'

// Estacion 4: un inmueble, cuatro superficies. Canvas 2D con proyeccion propia (sin dependencias).
// draw(t) es una funcion pura de t (0..1): mismo t, mismo cuadro; solo se dibuja cuando t cambia.
// Tramos: construir 0-0.20 · entorno 3D 0.20-0.52 (la orbita) · realidad virtual 0.48-0.78 · aplicacion web y plataforma 0.76-0.97.
// Sin movimiento (movil, movimiento reducido) se dibuja el cuadro final (t = 1).

type Handle = { draw: (t: number) => void; redraw: () => void; dispose: () => void }
const handles = new WeakMap<HTMLElement, Handle>()
const c01 = (x: number) => Math.min(1, Math.max(0, x))
const sm = (a: number, b: number, x: number) => {
  const u = c01((x - a) / (b - a))
  return u * u * (3 - 2 * u)
}
const mix = (a: number, b: number, k: number) => a + (b - a) * k
const FLOORS = 7, FH = 0.3, HX = 0.55, HZ = 0.4
const CORN: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
const WALLS: [number, number, number, number][] = [[-0.12, -HZ, -0.12, HZ], [-0.12, 0, HX, 0], [0.26, 0, 0.26, HZ]]
type P3 = [number, number, number]

function mountTower(fig: HTMLElement): Handle {
  const cv = fig.querySelector('canvas')!
  const ctx = cv.getContext('2d')!
  let lastT = 1, W = 0, H = 0, dpr = 1
  const draw = (t: number) => {
    lastT = t
    if (W < 4 || H < 4) return
    const cs = getComputedStyle(cv)
    const accent = cs.getPropertyValue('--accent').trim() || '#e6c15c'
    const fg = cs.getPropertyValue('--fg').trim() || '#ecebe6'
    const dim = cs.getPropertyValue('--dim').trim() || '#9a9a94'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.setLineDash([])
    const SH = H - 30 // altura de la escena; debajo, la franja de etiquetas
    const eP = sm(0.76, 0.9, t) // aplanado hacia el plano
    const hs = 1 - eP
    const yaw0 = 2.4 * (1 - sm(0.2, 0.52, t)) // la orbita ocupa todo su tramo y termina alineada con el plano
    const pitch = mix(0.42, Math.PI / 2, eP)
    const u = sm(0.48, 0.6, t) * (1 - sm(0.67, 0.78, t)) // dos vistas estereo
    const sT = Math.min((SH * 0.92) / 2.5, (W * 0.3) / 0.75)
    const sP = Math.min((W * 0.4) / (2 * HX), (SH * 0.62) / (2 * HZ))
    const sc = mix(sT, sP, eP)
    const cxS = mix(W / 2, W * 0.27, eP)
    const cy = SH / 2
    const yc = (FLOORS * FH * hs) / 2

    const view = (cx: number, yaw: number, s: number, alpha: number) => {
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
      const P = (x: number, y: number, z: number): P3 => {
        y -= yc
        const xr = x * cyw + z * syw
        const zr = -x * syw + z * cyw
        const up = y * cp - zr * sp
        const d = zr * cp + y * sp
        const f = 4.2 / (4.2 - d)
        return [cx + xr * f * s, cy - up * f * s, d]
      }
      const seg = (a: P3, b: P3, q: number, col: string, al: number) => {
        if (q <= 0 || al <= 0.005) return
        ctx.globalAlpha = al * alpha
        ctx.strokeStyle = col
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(mix(a[0], b[0], q), mix(a[1], b[1], q))
        ctx.stroke()
      }
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      // solar (base)
      const sl = CORN.map(([a, b]) => P(a * (HX + 0.14), 0, b * (HZ + 0.14)))
      const slabQ = sm(0, 0.03, t)
      for (let i = 0; i < 4; i++) seg(sl[i], sl[(i + 1) % 4], slabQ, fg, 0.22 + 0.1 * eP)
      // plantas: se levantan una a una, con sus aristas dibujandose
      for (let k = 0; k < FLOORS; k++) {
        const p = c01((t - 0.0125 - 0.025 * k) / 0.044)
        if (p <= 0) continue
        const rise = -Math.pow(1 - p, 2) * 0.3 * hs
        const y0 = k * FH * hs + rise, y1 = (k + 1) * FH * hs + rise
        const pts = CORN.map(([a, b]) => P(a * HX, y0, b * HZ)).concat(CORN.map(([a, b]) => P(a * HX, y1, b * HZ)))
        const fa = c01(p * 4) * c01(hs * 2.5)
        EDGES.forEach(([i, j], n) => {
          const dn = c01(0.5 + ((pts[i][2] + pts[j][2]) / 2) * 0.6) // las aristas del fondo, mas tenues
          seg(pts[i], pts[j], c01(p * 12 - n), accent, 0.58 * fa * (0.4 + 0.6 * dn))
        })
        // ventanas: tres marcas por cara visible
        const wa = c01((p - 0.7) / 0.3) * hs
        if (wa > 0.01) {
          for (let f = 0; f < 4; f++) {
            const [a0, b0] = CORN[f], [a1, b1] = CORN[(f + 1) % 4]
            const nx = b1 - b0, nz = -(a1 - a0) // normal exterior
            const nd = ((-nx * syw + nz * cyw) * cp) / 2
            if (nd <= 0.05) continue
            for (let w = 1; w <= 3; w++) {
              const x = mix(a0, a1, w / 4) * HX, z = mix(b0, b1, w / 4) * HZ
              seg(P(x, y0 + FH * hs * 0.3, z), P(x, y0 + FH * hs * 0.7, z), 1, fg, 0.38 * wa * c01(nd * 3))
            }
          }
        }
      }
      // plano: contorno y muros (habitaciones)
      const pa = sm(0.82, 0.92, t)
      if (pa > 0.01) {
        const o = CORN.map(([a, b]) => P(a * HX, 0, b * HZ))
        for (let i = 0; i < 4; i++) seg(o[i], o[(i + 1) % 4], 1, fg, 0.55 * pa)
        WALLS.forEach(([x1, z1, x2, z2]) => seg(P(x1, 0, z1), P(x2, 0, z2), 1, fg, 0.4 * pa))
      }
    }

    if (u <= 0.001) {
      view(cxS, yaw0, sc, 1)
    } else {
      // realidad virtual: dos lentes con una ligera paralaje entre ojos
      const R = 30
      const lw = mix(W * 1.3, W * 0.46, u), lh = mix(SH * 1.4, SH * 0.94, u)
      const eyes: [number, number][] = [[mix(cxS, W * 0.26, u), -1], [mix(cxS, W * 0.74, u), 1]]
      const dlt = 0.05 * sm(0.3, 1, u)
      eyes.forEach(([ex, sg], idx) => {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(ex - lw / 2, cy - lh / 2, lw, lh, R)
        ctx.clip()
        view(ex, yaw0 + sg * dlt, sc * mix(1, 0.86, u), idx === 0 ? 1 : sm(0, 0.5, u))
        ctx.restore()
      })
      const dp = sm(0.45, 0.95, u)
      if (dp > 0.01) {
        const per = 2 * (lw + lh) - (8 - 2 * Math.PI) * R
        ctx.strokeStyle = fg
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.45
        ctx.setLineDash([per * dp, per])
        eyes.forEach(([ex]) => {
          ctx.beginPath()
          ctx.roundRect(ex - lw / 2, cy - lh / 2, lw, lh, R)
          ctx.stroke()
        })
        ctx.setLineDash([])
      }
    }

    // ficha de inmueble (contorno): imagen, dos barras de texto y un boton
    const cw = W * 0.36, cX = W * 0.58
    const ch = Math.min(SH * 0.86, cw * 1.25), cY = (SH - ch) / 2
    const dashRR = (x: number, y: number, w: number, h: number, r: number, p: number, col: string, al: number) => {
      if (p <= 0.01) return
      const per = 2 * (w + h) - (8 - 2 * Math.PI) * r
      ctx.strokeStyle = col
      ctx.globalAlpha = al
      ctx.lineWidth = 1
      ctx.setLineDash([per * p, per])
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, r)
      ctx.stroke()
      ctx.setLineDash([])
    }
    const pd = 10
    dashRR(cX, cY, cw, ch, 2, sm(0.84, 0.9, t), fg, 0.5)
    const iw = cw - 2 * pd, ih = ch * 0.46
    dashRR(cX + pd, cY + pd, iw, ih, 2, sm(0.88, 0.92, t), fg, 0.4)
    const sk = sm(0.9, 0.93, t)
    if (sk > 0.01) {
      ctx.globalAlpha = 0.4 * sk
      ctx.strokeStyle = fg
      ctx.lineWidth = 1
      ;[[0.12, 0.42], [0.36, 0.7], [0.58, 0.5]].forEach(([fx, fh]) => {
        ctx.beginPath()
        ctx.rect(cX + pd + iw * fx, cY + pd + ih - ih * fh, iw * 0.2, ih * fh - 1)
        ctx.stroke()
      })
    }
    ;[[0.72, ih + pd + 16], [0.48, ih + pd + 28]].forEach(([fw, dy], n) => {
      const p = sm(0.92 + 0.01 * n, 0.95 + 0.01 * n, t)
      if (p <= 0.01) return
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = fg
      ctx.lineWidth = 3
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(cX + pd, cY + dy)
      ctx.lineTo(cX + pd + iw * fw * p, cY + dy)
      ctx.stroke()
    })
    ctx.lineCap = 'round'
    dashRR(cX + pd, cY + ch - pd - 18, iw * 0.42, 18, 2, sm(0.94, 0.97, t), accent, 0.65)

    // etiquetas (mono 12 px), una por tramo
    ctx.font = `12px ${cs.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = dim
    const lab = (txt: string, x: number, a: number) => {
      if (a <= 0.01) return
      ctx.globalAlpha = a
      ctx.fillText(txt, x, H - 8)
    }
    lab(fly.tower.env, W / 2, sm(0.22, 0.28, t) * (1 - sm(0.46, 0.51, t)))
    lab(fly.tower.vr, W / 2, sm(0.6, 0.66, t) * (1 - sm(0.72, 0.77, t)))
    lab(fly.tower.web, W * 0.27, sm(0.92, 0.97, t))
    lab(fly.tower.platform, cX + cw / 2, sm(0.92, 0.97, t))
    ctx.globalAlpha = 1
  }
  const size = () => {
    W = Math.round(cv.clientWidth)
    H = Math.round(cv.clientHeight)
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = Math.max(1, Math.round(W * dpr))
    cv.height = Math.max(1, Math.round(H * dpr))
    draw(lastT)
  }
  const ro = new ResizeObserver(size)
  ro.observe(cv)
  size()
  return { draw, redraw: () => draw(lastT), dispose: () => ro.disconnect() }
}

export function TowerGfx() {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const el = ref.current!
    const h = mountTower(el)
    handles.set(el, h)
    return () => {
      h.dispose()
      handles.delete(el)
    }
  }, [])
  const w = fly.tower
  return (
    <div className="gx-zone gx-zone-3">
      <figure className="gx gx-tower" ref={ref} role="img" aria-label={w.label}>
        <p className="gx-tag" aria-hidden="true">{fly.tag} · {w.note}</p>
        <canvas aria-hidden="true" />
      </figure>
      <StackVis />
    </div>
  )
}

export function buildTower(root: HTMLElement): TL {
  const h = handles.get(root)!
  const tl = tline()
  pad(tl)
  h.draw(0) // el cuadro inicial (un progress(0) sobre una linea ya en 0 no dispara onUpdate)
  tl.eventCallback('onUpdate', () => h.draw(tl.progress()))
  tl.eventCallback('onRevert' as 'onUpdate', () => h.draw(1)) // onRevert existe en gsap 3.12+ pero falta en los tipos
  return tl
}

export const redrawTower = (root: HTMLElement) => handles.get(root)?.redraw()

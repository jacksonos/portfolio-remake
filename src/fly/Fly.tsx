import { useMemo, useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, scrollToTarget } from '../lib/scroll'
import { registerAnchors } from '../mosaic/portraitScroll'
import { fly } from '../content'
import Diff from './Diff'
import { CobolVis } from './Visuals'
import { PackGfx, KneeGfx, LoopGfx, buildPack, buildKnee, buildLoop } from './Graphics'
import { MonoGfx, buildMono } from './MonoGfx'
import { TowerGfx, buildTower, redrawTower } from './TowerGfx'

// ---- constantes del vuelo (tunel CSS 3D)
const N = fly.stations.length
const D = 1500 // separacion entre estaciones (px de profundidad)
const S0 = -0.5 // camara al inicio (estacion 1 aun lejos)
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// ---- RITMO DEL VUELO: todas las longitudes en alturas de ventana (vh = innerHeight). Unica tabla a afinar.
// Camara por tramos en scroll: aproximacion -> [pausa en la estacion i -> viaje a la siguiente]; el grafico de cada
// estacion avanza LINEAL con el scroll (lead-in + toda la pausa), desacoplado de la velocidad de la camara.
const PACE = {
  approach: 1.0, // inicio del pin -> llega la estacion 1 (el retrato termina de disolverse en `dissolve`)
  dissolve: 0.84, // fin de la disolucion del retrato (px desde el inicio del pin)
  travel: 0.9, // viaje entre estaciones consecutivas (ease-in-out)
  holds: [0.6, 0.9, 0.6, 1.3, 0.9], // pausa en cada estacion: la camara casi quieta, solo avanza el grafico
  tail: 0.3, // pausa final extra sobre la estacion 5
  creep: 0.06, // avance de camara (unidades de estacion) a lo largo de cada pausa: deriva casi imperceptible
  lead: 0.35, // el grafico empieza `lead * travel` antes de que la pausa comience
  threadEnd: 0.15, // el hilo se completa a esta distancia (vh) del final del pin
}
type Layout = { total: number; segs: { y0: number; y1: number; c0: number; c1: number; ease: boolean }[]; hs: number[]; he: number[]; vh: number }
function layoutFor(vh: number): Layout {
  const segs: Layout['segs'] = []
  const hs: number[] = []
  const he: number[] = []
  let y = PACE.approach * vh
  segs.push({ y0: 0, y1: y, c0: S0, c1: 0, ease: true })
  PACE.holds.forEach((h, i) => {
    hs.push(y)
    y += h * vh
    he.push(y)
    segs.push({ y0: hs[i], y1: y, c0: i, c1: i + PACE.creep, ease: false })
    if (i < N - 1) {
      segs.push({ y0: y, y1: y + PACE.travel * vh, c0: i + PACE.creep, c1: i + 1, ease: true })
      y += PACE.travel * vh
    }
  })
  y += PACE.tail * vh
  segs.push({ y0: he[N - 1], y1: y, c0: N - 1 + PACE.creep, c1: N - 1 + PACE.creep, ease: false })
  return { total: y, segs, hs, he, vh }
}
let L = layoutFor(1)
/** posicion de la camara (en unidades de estacion) para px de scroll dentro del pin: funcion pura */
function camAt(px: number): number {
  const sg = L.segs
  if (px <= 0) return S0
  for (let k = 0; k < sg.length; k++) {
    const q = sg[k]
    if (px <= q.y1) {
      const u = q.y1 > q.y0 ? clamp((px - q.y0) / (q.y1 - q.y0)) : 1
      return q.c0 + (q.c1 - q.c0) * (q.ease ? u * u * (3 - 2 * u) : u)
    }
  }
  return sg[sg.length - 1].c1
}

// color de acento: fosforo -> hueso -> turquesa -> ambar segun la camara
const STOPS: [number, number[]][] = [
  [0, [61, 255, 114]],
  [1.1, [236, 235, 230]],
  [2.2, [92, 225, 230]],
  [3.2, [255, 176, 0]],
]
function accentAt(c: number): string {
  let i = 0
  while (i < STOPS.length - 2 && c > STOPS[i + 1][0]) i++
  const [a, ca] = STOPS[i]
  const [b, cb] = STOPS[i + 1]
  const t = clamp((c - a) / (b - a))
  const ch = (k: number) => Math.min(255, Math.round((ca[k] + (cb[k] - ca[k]) * t) / 6) * 6) // cuantizado: menos escrituras
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`
}

// ---- polvo y lineas: posiciones deterministas en el mundo 3D
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const Z_MIN = -(N - 1) * D - 2600
type Bit = { x: number; y: number; z: number; s: number; o: number }
function makeBits(count: number, seed: number, sizes: number[], ops: number[], rMin: number, rMax: number): Bit[] {
  const r = rng(seed)
  return Array.from({ length: count }, (_, i) => {
    const ang = r() * Math.PI * 2
    const rad = rMin + (rMax - rMin) * Math.pow(r(), 0.7)
    const k = i % sizes.length // 3 profundidades: tamaño y opacidad por clase
    return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad * 0.62, z: Z_MIN + r() * -Z_MIN, s: sizes[k], o: ops[k] }
  })
}

const copyOf = (i: number) => fly.stations[i]

function Station({ i, children, vis, gfx }: { i: number; children?: React.ReactNode; vis?: React.ReactNode; gfx?: React.ReactNode }) {
  const s = copyOf(i)
  return (
    <article className={`st st-${s.id}`} style={{ ['--i' as string]: i }} data-i={i}>
      <div className="st-copy">
        <ul className="st-meta">
          {s.meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <h2 className="st-title">{s.title}</h2>
        <p className="st-lesson">{s.lesson}</p>
        {s.text && <p className="st-text">{s.text}</p>}
        {s.parts && (
          <dl className="st-parts">
            {s.parts.map(([k, t]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {gfx}
      {vis}
      {children}
    </article>
  )
}

export default function Fly() {
  const root = useRef<HTMLElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const thread = useRef<SVGPathElement>(null)
  const goTo = useRef<(i: number) => void>(() => {})

  const dust = useMemo(() => makeBits(54, 11, [2, 3, 5], [0.55, 0.7, 0.85], 260, 1900), [])
  const lines = useMemo(() => makeBits(18, 29, [1], [0.4], 380, 1700), [])

  useGSAP(
    () => {
      const el = root.current!
      const mm = gsap.matchMedia()

      // Estado del flujo del vuelo (px = scroll dentro del pin). El retrato NO se escribe aqui: lo gobierna
      // mosaic/portraitScroll.ts (unico escritor); este modulo solo le registra donde empieza el tramo de disolverse.
      const st = { px: 0 }

      // ------------------------------------------------ escritorio con movimiento: el vuelo
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const w = world.current!
        const sts = Array.from(el.querySelectorAll<HTMLElement>('.st'))
        const bits = Array.from(el.querySelectorAll<HTMLElement>('.fly-dust, .fly-line'))
        const bitData = [...dust, ...lines]
        const cache = { st: sts.map(() => -1), bit: bits.map(() => -1), accent: '' }
        // graficos centrales: lineas de tiempo pausadas, avanzan con t lineal en el scroll: de (inicio de la pausa - lead) al fin de la pausa
        const gfx = [
          { i: 0, build: buildPack, sel: '.gx-pack' },
          { i: 1, build: buildMono, sel: '.gx-mono' },
          { i: 2, build: buildKnee, sel: '.gx-knee' },
          { i: 3, build: buildTower, sel: '.gx-tower', redraw: redrawTower },
          { i: 4, build: buildLoop, sel: '.gx-loop' },
        ].map((g) => ({
          i: g.i,
          redraw: g.redraw ? () => g.redraw!(el.querySelector<HTMLElement>(g.sel)!) : undefined,
          tl: g.build(el.querySelector<HTMLElement>(g.sel)!),
          t: -1,
        }))
        const path = thread.current!
        gsap.set(path, { drawSVG: '0%' })
        const threadTween = gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', paused: true })

        const render = () => {
          const c = camAt(st.px)
          w.style.transform = `translate3d(0,0,${c * D}px)`
          sts.forEach((n, i) => {
            const r = i - c
            const o = sstep(0.5, 0.15, r) * (i === N - 1 ? 1 : 1 - sstep(-0.1, -0.4, r))
            if (Math.abs(o - cache.st[i]) > 0.002) {
              cache.st[i] = o
              n.style.opacity = o.toFixed(3)
              n.classList.toggle('is-on', o > 0.5)
            }
          })
          const cz = c * D
          bits.forEach((n, i) => {
            const a = bitData[i].z + cz // profundidad aparente
            const o = bitData[i].o * sstep(-3600, -2000, a) * (1 - sstep(-250, 450, a))
            if (Math.abs(o - cache.bit[i]) > 0.01) {
              cache.bit[i] = o
              n.style.opacity = o.toFixed(2)
            }
          })
          const col = accentAt(c)
          const accentChanged = col !== cache.accent
          if (accentChanged) {
            cache.accent = col
            el.style.setProperty('--accent', col)
          }
          gfx.forEach((g) => {
            const t0 = L.hs[g.i] - PACE.lead * PACE.travel * L.vh
            const t = clamp((st.px - t0) / (L.he[g.i] - t0))
            if (t !== g.t) {
              g.t = t
              g.tl.progress(t)
            } else if (accentChanged && g.redraw && cache.st[g.i] > 0.01) g.redraw() // el canvas lee --accent al dibujar
          })
          threadTween.progress(clamp(st.px / (L.total - PACE.threadEnd * L.vh)))
        }

        const pin = ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: () => {
            L = layoutFor(window.innerHeight)
            return `+=${L.total}`
          },
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            st.px = self.scroll() - self.start
            render()
          },
          onRefresh: (self) => {
            L = layoutFor(window.innerHeight)
            st.px = self.scroll() - self.start
            render()
          },
        })
        L = layoutFor(window.innerHeight)
        // el retrato se disuelve desde el inicio del pin hasta PACE.dissolve vh (antes de que llegue la estacion 1)
        const offDis = registerAnchors('dissolve', () => [pin.start, pin.start + PACE.dissolve * window.innerHeight])

        let lastGo = -1e12
        goTo.current = (i) => {
          if (cache.st[i] > 0.5) return
          const now = performance.now()
          if (now - lastGo < 1400) return // ya viajando hacia alli (Tab entre botones)
          lastGo = now
          scrollToTarget(pin.start + L.hs[i], { duration: 1.2, immediate: false })
        }
        render()
        return () => {
          goTo.current = () => {}
          gfx.forEach((g) => g.tl.revert())
          offDis()
          pin.kill()
          threadTween.kill()
          el.style.removeProperty('--accent')
        }
      })

      // ------------------------------------------------ movil o movimiento reducido: apilado
      mm.add({ stacked: '(max-width: 767px), (prefers-reduced-motion: reduce)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        gsap.set(thread.current!, { clearProps: 'all' })
        const reduce = !!ctx.conditions?.reduce
        // movil: continuo (el hero se va mientras entra el vuelo); movimiento reducido: un solo salto al llegar
        const hold = ScrollTrigger.create({
          trigger: el,
          start: reduce ? 'top 60%' : 'top 70%',
          end: reduce ? 'top 60%' : 'top 20%',
        })
        const off = registerAnchors('dissolve', () => [hold.start, hold.end])
        return () => { off(); hold.kill() }
      })
    },
    { scope: root },
  )

  return (
    <section id="recorrido" className="fly" ref={root} aria-label="Recorrido">
      <div className="fly-pin">
        <svg className="fly-thread" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
          <path
            ref={thread}
            d="M-30 790 C150 710 260 850 420 770 S640 660 760 745 S900 865 1040 775 S1200 665 1300 745 S1400 835 1470 770"
          />
        </svg>
        <svg className="fly-thread-v" viewBox="0 0 400 2400" preserveAspectRatio="none" aria-hidden="true">
          <path d="M40 0 C300 180 60 330 250 520 S380 780 150 980 S40 1240 260 1440 S360 1700 120 1900 S200 2200 330 2400" />
        </svg>
        <div className="fly-stage">
          <div className="fly-world" ref={world} aria-hidden="false">
            {dust.map((b, k) => (
              <i
                key={`d${k}`}
                className="fly-dust"
                aria-hidden="true"
                style={{ width: b.s, height: b.s, transform: `translate3d(${b.x.toFixed(0)}px,${b.y.toFixed(0)}px,${b.z.toFixed(0)}px)` }}
              />
            ))}
            {lines.map((b, k) => (
              <i
                key={`l${k}`}
                className="fly-line"
                aria-hidden="true"
                style={{ transform: `translate3d(${b.x.toFixed(0)}px,${b.y.toFixed(0)}px,${b.z.toFixed(0)}px) rotateY(90deg)` }}
              />
            ))}
            <Station i={0} gfx={<PackGfx />} vis={<CobolVis />} />
            <Station i={1} gfx={<MonoGfx />} />
            <Station i={2} gfx={<KneeGfx />} />
            <Station i={3} gfx={<TowerGfx />} />
            <Station i={4} gfx={<LoopGfx />}>
              <div className="st-vis vis-diff">
                <Diff onFocusIn={() => goTo.current(4)} />
              </div>
            </Station>
          </div>
        </div>
      </div>
    </section>
  )
}

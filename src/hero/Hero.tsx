import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP, scrollToTarget } from '../lib/scroll'
import { mosaic } from '../mosaic/api'
import { PH_D } from '../mosaic/engine'
import { hero, site } from '../content'

const initials = site.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2)

function localTime(): string {
  try {
    return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: site.tz }).format(new Date())
  } catch {
    return ''
  }
}

const go = (sel: string) => (e: React.MouseEvent) => {
  e.preventDefault()
  scrollToTarget(sel)
}

/** Etiqueta larga (escritorio) y corta (móvil): CSS muestra una sola, el lector de pantalla lee una vez. */
const navText = (i: number) =>
  hero.navShort[i] === hero.nav[i] ? (
    hero.nav[i]
  ) : (
    <>
      <span className="d-only">{hero.nav[i]}</span>
      <span className="m-only">{hero.navShort[i]}</span>
    </>
  )

/** Banda superior: marca, microetiquetas y navegacion. Landmark banner. */
export function HeroHeader() {
  const [time, setTime] = useState(localTime)
  useEffect(() => {
    let t = 0
    const tick = () => {
      setTime(localTime())
      t = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
    }
    t = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <header className="hero-top">
      <a className="hero-mark" href="#hero" aria-label={`${site.name}, inicio`} onClick={go('#hero')}>
        {initials}
      </a>
      <div className="hero-label hero-now">
        <span className="hero-label-k">{hero.labels.now}</span>
        <span className="hero-label-v">{site.role}</span>
        <span className="hero-label-sub">{hero.nowSub}</span>
      </div>
      <div className="hero-label hero-based">
        <span className="hero-label-k">{hero.labels.based}</span>
        <span className="hero-label-v">
          <span className="d-only">{site.city}</span>
          <span className="m-only">{site.cityShort}</span>
          {time && (
            <>
              <span className="d-only"> (</span>
              <span className="m-only"> · </span>
              <time className="hero-time">{time}</time>
              <span className="d-only">)</span>
            </>
          )}
        </span>
      </div>
      <nav className="hero-label" aria-label="Principal">
        <span className="hero-label-k">{hero.labels.nav}</span>
        <ul className="hero-nav">
          <li><a href="#recorrido" onClick={go('#recorrido')}>{navText(0)}</a></li>
          <li>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-principios'))}>{navText(1)}</button>
          </li>
          <li><a href="#contacto" onClick={go('#contacto')}>{navText(2)}</a></li>
        </ul>
      </nav>
    </header>
  )
}

type Pt = [number, number]
type Box = [number, number, number, number]

// Perfil del retrato (canal alfa de public/portrait.png), por fila: [v, borde izquierdo, borde derecho], en fracciones de la foto.
const PROF = [[.06, .45, .51], [.075, .394, .557], [.1, .384, .603], [.125, .307, .637], [.15, .285, .664], [.175, .26, .676], [.2, .255, .688], [.225, .254, .695], [.25, .254, .699], [.275, .244, .706], [.3, .234, .706], [.325, .228, .714], [.35, .234, .711], [.375, .241, .711], [.4, .253, .706], [.425, .265, .698], [.45, .271, .693], [.475, .287, .682], [.5, .301, .662], [.5125, .311, .66], [.525, .344, .657], [.55, .359, .652], [.575, .345, .642], [.6, .254, .7], [.625, .174, .769], [.65, .115, .804], [.675, .074, .855], [.7, .066, .9], [.725, .066, .914], [.75, .066, .93], [.8, .066, .932]]
const edge = (v: number, k: 1 | 2) => {
  if (v <= PROF[0][0]) return PROF[0][k]
  for (let i = 1; i < PROF.length; i++) {
    if (v <= PROF[i][0]) {
      const a = PROF[i - 1], b = PROF[i]
      return a[k] + ((b[k] - a[k]) * (v - a[0])) / (b[0] - a[0])
    }
  }
  return PROF[PROF.length - 1][k]
}

const fp = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`
const rad = (d: number) => (d * Math.PI) / 180

/** Nudo de pluma: posicion, rumbo (grados; 0 derecha, 90 abajo) y largo de las asas de entrada y salida. Mismo rumbo a ambos lados: empalme C1. */
type Kn = { p: Pt; a: number; i?: number; o?: number }
const K = (x: number, y: number, a: number, i?: number, o?: number): Kn => ({ p: [x, y], a, i, o })
/** Cadena de Beziers cubicas entre nudos; asas por defecto = 36 % de la cuerda. */
function chain(ks: Kn[]) {
  let d = 'M' + fp(ks[0].p)
  for (let n = 1; n < ks.length; n++) {
    const A = ks[n - 1], B = ks[n]
    const L = Math.hypot(B.p[0] - A.p[0], B.p[1] - A.p[1]) * 0.36
    const oa = A.o ?? L, ib = B.i ?? L
    d += `C${fp([A.p[0] + Math.cos(rad(A.a)) * oa, A.p[1] + Math.sin(rad(A.a)) * oa])} ${fp([B.p[0] - Math.cos(rad(B.a)) * ib, B.p[1] - Math.sin(rad(B.a)) * ib])} ${fp(B.p)}`
  }
  return d
}
const KAPPA = 0.5523 // cuarto de circulo con una cubica

/**
 * Cinta en helice que envuelve al retrato (solo escritorio). Un solo hilo de Beziers cubicas con empalmes C1, escrito con
 * nudos de pluma sobre puntos de referencia reales (PH_D + PROF y las cajas de texto del DOM). Recorrido: entra desde la izquierda
 * (por encima del parrafo si estorba), cruza el pecho bajo el menton, rodea el hombro derecho en un rizo, pasa por DETRAS del cuello
 * y de la cabeza (tramo oculto con una mascara de la silueta), reaparece por el lado izquierdo de la cabeza, sube por fuera de la
 * silueta y remata en una bombilla. Paths: 0 entrada+pecho+rizo, 1 tramo trasero (enmascarado), 2 ascenso+tallo, 3 contorno de la
 * bombilla, 4 filamento, 5-7 rayos. El sistema de coordenadas es el del lienzo fijo (viewport), calculado a scroll 0.
 */
function layoutScribble(hero: HTMLElement, svg: SVGSVGElement, paths: SVGPathElement[], mask: SVGPathElement) {
  const W = document.documentElement.clientWidth, H = window.innerHeight
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const mr = svg.querySelector('mask rect')
  mr?.setAttribute('width', String(W))
  mr?.setAttribute('height', String(H))
  const out = (d: string[]) => {
    paths.forEach((p, i) => p.setAttribute('d', d[i] ?? ''))
    if (!d.length) mask.setAttribute('d', '')
  }
  if (window.innerWidth < 768) return out([])
  const bh = H * PH_D[0], T0 = H * PH_D[1], L0 = (W - bh) / 2
  const top = hero.getBoundingClientRect().top // las cajas se miden relativas al hero: a scroll 0 son coordenadas del viewport
  const boxes = (sel: string) => {
    const r: Box[] = [], el = document.querySelector(sel)
    if (!el) return r
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent?.trim()) continue
      const rg = document.createRange()
      rg.selectNodeContents(n)
      for (const q of rg.getClientRects()) if (q.width > 1) r.push([q.left, q.top - top, q.right, q.bottom - top])
    }
    return r
  }
  const hdr = boxes('.hero-top'), blurb = boxes('.hero-blurb')
  const pill = document.querySelector('.hero-pill')?.getBoundingClientRect()
  const nameEl = document.querySelector('.hero-name')
  const nameInk = nameEl ? nameEl.getBoundingClientRect().top - top + 0.06 * parseFloat(getComputedStyle(nameEl).fontSize) : H // tinta de las mayusculas

  const X = (u: number) => L0 + u * bh, Y = (v: number) => T0 + v * bh
  const vOf = (y: number) => (y - T0) / bh
  const hl = (y: number) => X(edge(vOf(y), 1)), hr = (y: number) => X(edge(vOf(y), 2))
  const bTop = blurb.length ? Math.min(...blurb.map((q) => q[1])) : H
  const bR = blurb.length ? Math.max(...blurb.map((q) => q[2])) : 0
  const gut = blurb.length ? Math.min(...blurb.map((q) => q[0])) : 24

  // mascara: la silueta (hinchada 6 px) oculta el tramo que pasa por detras del cuello y la cabeza
  const last = PROF[PROF.length - 1]
  const rows = [...PROF, [1.2, last[1], last[2]]]
  mask.setAttribute(
    'd',
    'M' + rows.map((q) => fp([X(q[1]) - 6, Y(q[0])])).join('L') + 'L' + [...rows].reverse().map((q) => fp([X(q[2]) + 6, Y(q[0])])).join('L') + 'Z',
  )

  // franja del pecho: del menton (+16) a la tinta del nombre (-34); la cara delantera del anillo vive ahi
  const yChin = Y(0.56), yF = nameInk - 34
  const b = Math.min(Math.max((yF - yChin - 16) / 2, 30), 0.065 * bh) // radio del rizo
  const tilt = 0.022 * bh // el lado derecho queda algo mas alto: anillo ligeramente inclinado
  const yCap = yF - tilt - b // centro del rizo derecho
  let xR = hr(yCap) + 0.07 * bh
  if (pill && pill.top - top - 28 < yCap + b && pill.bottom - top + 28 > yCap - b) xR = Math.min(xR, pill.left - 34)
  const ax = Math.max(b, Math.min(1.5 * b, (b * b) / 28)) // semieje horizontal del rizo: la punta (radio b^2/ax) nunca baja de ~28 px
  const xc = Math.max(xR - ax, X(0.55))

  // entrada + cara delantera + rizo derecho
  const xj = X(0.47) // punto mas bajo del pecho, bajo el cuello
  const xs = Math.max(gut, xj - 0.72 * bh)
  const para = blurb.length > 0 && xs < bR + 30
  const entry: Kn[] = para
    ? [K(xs, bTop - 36, 0), K(bR + 36, bTop - 36, 12), K(xj, yF, 0)]
    : [K(xs, yF - 0.05 * bh, 3), K(xj, yF, 0)]
  const front: Kn[] = [...entry, K(xc, yF - tilt, -3, undefined, KAPPA * ax), K(xc + ax, yCap, 270, KAPPA * b, KAPPA * b), K(xc, yCap - b, 186, KAPPA * ax)]

  // tramo trasero (por detras del cuello y la cabeza) hasta reaparecer en el borde izquierdo de la cabeza, y ascenso
  const yE = Y(0.49), xE = hl(yE) - 9
  const xb0 = hl(Y(0.2)) - 0.07 * bh // eje del tallo
  const r = Math.max(0.036 * bh, 28) // radio del bulbo
  const tb = (x0: number, x1: number) => Math.max(0, ...hdr.filter((q) => x1 >= q[0] - 16 && x0 <= q[2] + 16).map((q) => q[3]))
  const xb = Math.max(xb0, r * 1.8 + 8)
  const yc = Math.max(Y(0.205), tb(xb - 2 * r, xb + 2 * r) + 16 + 1.75 * r) // centro del bulbo
  const yTip = yc + 1.84 * r
  const cap = front[front.length - 1]
  const back: Kn[] = [{ ...cap, o: 0.3 * Math.hypot(xE - cap.p[0], yE - cap.p[1]) }, K(xE, yE, 192)] // salida larga: sin pico de curvatura tras el rizo
  const climb: Kn[] = [back[1], K(xb - 0.01 * bh, Y(0.4), 266), K(xb, yTip, 270)]

  // bulbo: icono de linea geometrico en unidades de r (centro del bulbo en el origen)
  const P = (x: number, y: number) => `${(xb + r * x).toFixed(1)} ${(yc + r * y).toFixed(1)}`
  const pa = (f: number) => [Math.cos(rad(f)), Math.sin(rad(f))]
  let glass = `M${P(-0.42, 1.4)}L${P(-0.55, 0.835)}`
  const f0 = 123.4, df = 293.2 / 4, k = (4 / 3) * Math.tan(rad(df / 4))
  for (let n = 0; n < 4; n++) {
    const fa = f0 + n * df, fb = fa + df
    const [ca, sa] = pa(fa), [cb, sb] = pa(fb)
    glass += `C${P(ca - k * sa, sa + k * ca)} ${P(cb + k * sb, sb - k * cb)} ${P(cb, sb)}`
  }
  glass += `L${P(0.42, 1.4)}ZM${P(-0.34, 1.62)}L${P(0.34, 1.62)}M${P(-0.22, 1.84)}L${P(0.22, 1.84)}`
  const filament = `M${P(-0.26, 1.38)}L${P(-0.26, 0.62)}C${P(-0.26, 0.34)} ${P(-0.06, 0.3)} ${P(0, 0.5)}C${P(0.06, 0.3)} ${P(0.26, 0.34)} ${P(0.26, 0.62)}L${P(0.26, 1.38)}`
  const ray = (deg: number) => {
    const [c, s] = pa(deg)
    return `M${P(c * 1.32, s * 1.32)}L${P(c * 1.75, s * 1.75)}`
  }
  out([chain(front), chain(back), chain(climb), glass, filament, ray(-140), ray(-90), ray(-40)])
}

export default function Hero() {
  const scope = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      const el = nameRef.current!
      const svg = svgRef.current!
      const all = Array.from(svg.querySelectorAll<SVGPathElement>('path.hs'))
      const maskPath = svg.querySelector<SVGPathElement>('mask path')!
      const live = () => all.filter((p) => p.getAttribute('d'))
      const layout = () => layoutScribble(scope.current!, svg, all, maskPath)
      layout()
      document.fonts.ready.then(layout) // las cajas de texto cambian al cargar las fuentes
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(el, { type: 'words,chars' })
        gsap.set(split.chars, { yPercent: 55, opacity: 0 })
        const draw = () => window.matchMedia('(min-width: 768px)').matches // el trazo solo existe en escritorio
        gsap.set(all, { visibility: 'hidden' })
        if (draw()) gsap.set(live(), { drawSVG: '0%' })
        el.classList.remove('is-pending')
        // la capa es fija como el retrato (que no se mueve en escritorio): se desvanece con el scroll, reversible, y es invisible
        // mucho antes de que empiece la disolucion del rostro (inicio del vuelo, ~1 pantalla)
        gsap.to(svg, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: { start: 0, end: () => 0.6 * window.innerHeight, scrub: true, invalidateOnRefresh: true },
        })
        let played = false
        let tl: gsap.core.Timeline | undefined
        const onResize = () => {
          layout()
          if (!draw()) return
          tl?.kill()
          gsap.set(all, { clearProps: 'strokeDasharray,strokeDashoffset' }) // gsap guarda la longitud: que la relea
          gsap.set(all, { visibility: 'hidden' })
          gsap.set(live(), { drawSVG: played ? '100%' : '0%', visibility: played ? 'visible' : 'hidden' }) // la longitud cambia con el trazo
          if (played) gsap.set(all, { clearProps: 'strokeDasharray,strokeDashoffset' }) // dibujado: trazo entero, sin dash
        }
        window.addEventListener('resize', onResize)
        const play = () => {
          if (played) return
          played = true
          layout()
          gsap.to(split.chars, { yPercent: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.045 })
          if (!draw()) return
          // la linea (paths 0-2: subtrazos, uno tras otro con una sola curva de ease; el tramo trasero, casi oculto, pesa poco)
          // y luego bombilla, filamento y rayos
          const line = all.slice(0, 3).filter((p) => p.getAttribute('d'))
          const lens = line.map((p) => p.getTotalLength() * (p === all[1] ? 0.3 : 1))
          const total = lens.reduce((a, b) => a + b, 0)
          const prog = { v: 0 }
          tl = gsap.timeline({ delay: 0.6, onComplete: () => gsap.set(all, { clearProps: 'strokeDasharray,strokeDashoffset' }) })
          tl.to(prog, {
            v: 1,
            duration: 2.8,
            ease: 'sine.inOut',
            onUpdate: () => {
              let run = prog.v * total
              line.forEach((p, i) => {
                const f = Math.min(1, Math.max(0, run / lens[i]))
                run -= lens[i]
                gsap.set(p, { drawSVG: `${f * 100}%`, visibility: f > 0 ? 'visible' : 'hidden' })
              })
            },
          })
          ;([[3, 2.8, 0.45], [4, 3.25, 0.3], [5, 3.55, 0.2], [6, 3.65, 0.2], [7, 3.75, 0.2]] as const).forEach(([i, at, dur]) => {
            if (!all[i].getAttribute('d')) return
            tl!.set(all[i], { visibility: 'visible' }, at)
            tl!.fromTo(all[i], { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'sine.inOut', immediateRender: false }, at)
          })
        }
        const off = mosaic.onFormed(play)
        const fallback = gsap.delayedCall(4, play) // si el lienzo no llegara a formar
        return () => {
          window.removeEventListener('resize', onResize)
          off()
          fallback.kill()
          tl?.kill()
          split.revert()
        }
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        el.classList.remove('is-pending')
        window.addEventListener('resize', layout)
        // sin scrub: se oculta de golpe antes del salto del retrato (Fly: 'top 60%'), cuando el hero ya sale de la pantalla
        const hide = ScrollTrigger.create({
          trigger: scope.current,
          start: 'bottom 75%',
          end: 'max',
          onToggle: (self) => { svg.style.visibility = self.isActive ? 'hidden' : '' },
        })
        return () => {
          window.removeEventListener('resize', layout)
          hide.kill()
          svg.style.visibility = ''
        }
      })
    },
    { scope },
  )

  return (
    <section id="hero" className="hero" ref={scope}>
      <svg ref={svgRef} className="hero-scribble" aria-hidden="true">
        <defs>
          <mask id="hs-behind" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            <path fill="#000" />
          </mask>
        </defs>
        <path className="hs" />
        <g mask="url(#hs-behind)">
          <path className="hs" />
        </g>
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} className={i > 1 ? 'hs is-acc' : 'hs'} />
        ))}
      </svg>

      <div className="hero-foot">
        <p className="hero-blurb"><span>{hero.blurb}</span></p>
        <button type="button" className="hero-pill" onClick={() => scrollToTarget('#recorrido')}>
          <span>{hero.cta}</span>
          <span className="hero-pill-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 1.5v11M2.5 8 7 12.5 11.5 8" />
            </svg>
          </span>
        </button>
      </div>

      <h1 className="hero-name is-pending" ref={nameRef}>{site.name}</h1>
    </section>
  )
}

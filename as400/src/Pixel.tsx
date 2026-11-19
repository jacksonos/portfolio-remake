import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type Lenis from 'lenis'
import * as S from './sprites'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* ---------- estado compartido del "terminal" ---------- */
export const term = {
  lenis: null as Lenis | null,
  setSec: (_n: number) => {},
  setCmd: (_s: string) => {},
  powerCycle: () => {},
}

export function goTo(id: string, cmd?: string) {
  if (cmd) term.setCmd(cmd)
  const el = id === 'top' ? null : document.getElementById(id)
  if (term.lenis) {
    term.lenis.scrollTo(el ?? 0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) })
  } else {
    window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY : 0 })
  }
}

/* ---------- texto tecleado: el DOM siempre trae el texto completo ---------- */
export function Ty({ t, className = '', block = false }: { t: string; className?: string; block?: boolean }) {
  const r = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (r.current) r.current.textContent = t
  }, [t])
  const typed = <span ref={r} aria-hidden="true" data-t={t} className={'ty ' + className} />
  return (
    <>
      <span className="sr-only">{t}</span>
      {block ? (
        // el fantasma reserva el tamano final para que teclear no mueva el layout
        <span className="tyw">
          <span className="ty-g" aria-hidden="true">
            {t}
          </span>
          {typed}
        </span>
      ) : (
        typed
      )}
    </>
  )
}

export function typeTo(tl: gsap.core.Timeline, el: Element | null | undefined, at: number | string, dur: number) {
  if (!el) return
  const t = (el as HTMLElement).dataset.t ?? ''
  const o = { n: 0 }
  el.textContent = ''
  tl.to(
    o,
    {
      n: t.length,
      duration: dur,
      ease: 'none',
      onUpdate() {
        const s = t.slice(0, Math.round(o.n))
        if (el.textContent !== s) el.textContent = s
      },
    },
    at,
  )
}

export function fillTy(root: ParentNode | null) {
  root?.querySelectorAll<HTMLElement>('.ty').forEach((e) => (e.textContent = e.dataset.t ?? ''))
}

// teclea una lista de elementos al entrar en pantalla (una vez), escalonado
export function typeOnEnter(trigger: Element, els: Element[], start = 'top 75%') {
  const tl = gsap.timeline({ scrollTrigger: { trigger, start, once: true } })
  els.forEach((e) => typeTo(tl, e, els.indexOf(e) * 0.18, Math.max(0.3, ((e as HTMLElement).dataset.t ?? '').length * 0.012)))
  return tl
}

/* ---------- sprites ---------- */
const COL: Record<string, string> = { w: '#ffffff', c: '#40f0e8', y: '#ffe03a', r: '#ff5555', m: '#ff6ad5', b: '#6a8bff' }

export function draw(cv: HTMLCanvasElement, frame: string[], pal: Record<string, string> = {}) {
  const ctx = cv.getContext('2d')
  if (!ctx) return
  const cs = getComputedStyle(cv)
  const P = cs.getPropertyValue('--p').trim() || '#33ff66'
  const D = cs.getPropertyValue('--p-dim').trim() || '#1fa044'
  const w = frame[0].length
  const h = frame.length
  if (cv.width !== w || cv.height !== h) {
    cv.width = w
    cv.height = h
  }
  ctx.clearRect(0, 0, w, h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = frame[y][x]
      if (ch === '.') continue
      ctx.fillStyle = ch === 'p' ? P : ch === 'd' ? D : (pal[ch] ?? COL[ch] ?? '#fff')
      ctx.fillRect(x, y, 1, 1)
    }
}

export function Sprite({
  frames,
  scale = 4,
  fps = 0,
  pal,
  className = '',
}: {
  frames: string[][]
  scale?: number
  fps?: number
  pal?: Record<string, string>
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    let i = 0
    const paint = () => draw(cv, frames[i], pal)
    paint()
    window.addEventListener('phos', paint)
    let tick: ((t: number) => void) | undefined
    if (fps && frames.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const off = Math.random() * 3
      tick = (t) => {
        const n = Math.floor((t + off) * fps) % frames.length
        if (n !== i) {
          i = n
          paint()
        }
      }
      gsap.ticker.add(tick)
    }
    return () => {
      window.removeEventListener('phos', paint)
      if (tick) gsap.ticker.remove(tick)
    }
  }, [frames, fps, pal])
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={'pxl ' + className}
      style={{ width: frames[0][0].length * scale, height: frames[0].length * scale }}
    />
  )
}

/* ---------- parallax: lluvia ASCII (fondo), sprites medios y frontales ---------- */
type Item = [string[][], number, number, number, number] // frames, top vh, left %, scale, fps
const MID: Item[] = [
  [S.disk, 12, 4, 4, 2],
  [S.cursor, 45, 91, 5, 2],
  [S.tower, 75, 3, 4, 2],
  [S.wblock, 110, 92, 4, 1],
  [S.robot, 145, 5, 4, 2],
  [S.sparkle, 180, 90, 5, 3],
  [S.disk, 215, 6, 4, 2],
]
const FRONT: Item[] = [
  [S.sparkle, 30, 93, 7, 3],
  [S.cursor, 85, 2, 9, 2],
  [S.robot, 150, 92, 7, 2],
  [S.tower, 215, 2, 7, 2],
  [S.disk, 270, 93, 7, 2],
]

export function Parallax() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ motion: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 768px) and (pointer: fine)' }, (ctx) => {
        const c = ctx.conditions as { motion: boolean; desk: boolean }
        if (!c.motion) return
        const el = root.current!
        gsap.utils.toArray<HTMLElement>('.plx-l', el).forEach((l) =>
          gsap.to(l, {
            yPercent: -Number(l.dataset.d),
            ease: 'none',
            scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 0.6 },
          }),
        )
        gsap.utils.toArray<HTMLElement>('.bob', el).forEach((b) =>
          gsap.to(b, { y: -10, duration: 0.8 + Math.random() * 0.8, repeat: -1, yoyo: true, ease: 'steps(5)' }),
        )
        // lluvia ASCII en canvas, desplazada por el scroll (scrub)
        const cv = el.querySelector<HTMLCanvasElement>('.plx-rain')!
        const g = cv.getContext('2d')!
        const off = { v: 0 }
        gsap.to(off, {
          v: 900,
          ease: 'none',
          scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 0.6 },
        })
        const FS = 15
        let cols = 0
        let drops: number[] = []
        const size = () => {
          cv.width = innerWidth
          cv.height = innerHeight
          cols = Math.ceil(cv.width / (FS * 1.4))
          drops = Array.from({ length: cols }, () => Math.random() * -60)
        }
        size()
        addEventListener('resize', size)
        const chars = '01ABCDEF*/<>_#%QSYS'
        let last = 0
        const rain = (t: number) => {
          if (t - last < 0.09) return
          last = t
          const P = getComputedStyle(cv).getPropertyValue('--p').trim() || '#33ff66'
          g.clearRect(0, 0, cv.width, cv.height)
          g.font = `${FS}px "IBM Plex Mono", monospace`
          g.fillStyle = P
          for (let i = 0; i < cols; i++) {
            drops[i] += 0.5
            const head = Math.floor(drops[i])
            for (let k = 0; k < 7; k++) {
              g.globalAlpha = 0.16 - k * 0.02
              const y = (((head - k) * FS + off.v * 0.3) % (cv.height + FS * 6)) + 0
              if (head - k < 0) continue
              g.fillText(chars[(i * 7 + head - k) % chars.length], i * FS * 1.4, y)
            }
            if (head * FS > cv.height + FS * 8 && Math.random() > 0.97) drops[i] = Math.random() * -30
          }
          g.globalAlpha = 1
        }
        gsap.ticker.add(rain)
        // micro-parallax con el raton (solo escritorio)
        const moves: (() => void)[] = []
        if (c.desk) {
          gsap.utils.toArray<HTMLElement>('.plx-m', el).forEach((m) => {
            const f = Number(m.dataset.f)
            const qx = gsap.quickTo(m, 'x', { duration: 0.8, ease: 'power3' })
            const qy = gsap.quickTo(m, 'y', { duration: 0.8, ease: 'power3' })
            const h = (e: MouseEvent) => {
              qx((e.clientX / innerWidth - 0.5) * f)
              qy((e.clientY / innerHeight - 0.5) * f)
            }
            addEventListener('mousemove', h)
            moves.push(() => removeEventListener('mousemove', h))
          })
        }
        return () => {
          gsap.ticker.remove(rain)
          removeEventListener('resize', size)
          moves.forEach((f) => f())
          g.clearRect(0, 0, cv.width, cv.height)
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const layer = (items: Item[], d: number, f: number, cls: string) => (
    <div className={'plx-l ' + cls} data-d={d}>
      <div className="plx-m" data-f={f}>
        {items.map(([fr, top, left, sc, fps], i) => (
          <div key={i} className="plx-s" style={{ top: `${top}vh`, left: `${left}%` }}>
            <div className="bob">
              <Sprite frames={fr} scale={sc} fps={fps} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div ref={root} className="plx" aria-hidden="true">
      <div className="plx-l plx-grid" data-d={12} />
      <canvas className="plx-rain" />
      {layer(MID, 45, 14, 'plx-mid')}
      {layer(FRONT, 66, 30, 'plx-front')}
    </div>
  )
}

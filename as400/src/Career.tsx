import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Ty, draw, fillTy, typeOnEnter, typeTo } from './Pixel'
import { parallel, stages } from './content'
import type { Job } from './content'
import * as S from './sprites'

const CELLS = 16
const bar = (k: number) => '█'.repeat(k) + '░'.repeat(CELLS - k)
const T0 = 1.3
const D = 3.2
const SL = 0.6 // duracion del deslizamiento al bifurcarse / fusionarse
const N = stages.length
const clamp = (x: number) => Math.min(1, Math.max(0, x))
const at = (k: number) => T0 + k * D
const TT = (N - 1) * D // duracion total del recorrido
const MG = 1.2 // los clones se funden MG segundos antes de la etiqueta del ultimo paso, que queda libre
const lag = (ri: number) => 0.45 * (ri + 1) // cada clon sigue al caminante principal con este retraso (s)

// ---------- datos derivados: trabajos, carriles, clones, tarjetas paralelas ----------
type J = Job & { from: number; to: number; lane: number; look: number; primary: number }
const jobs: J[] = [
  ...stages.map((s, i) => ({ ...s, from: i, to: s.until ?? i, lane: 0, look: i, primary: i })),
  ...parallel.map((p) => ({ ...p, lane: 0, primary: -1 })),
].sort((x, y) => x.from - y.from) // estable: los primarios van antes en empates
const busy: number[] = [] // ultimo paso ocupado por carril (asignacion voraz por inicio)
jobs.forEach((j) => {
  let l = busy.findIndex((e) => e < j.from)
  if (l < 0) l = busy.length
  busy[l] = j.to
  j.lane = l
})
const LY = [57, 99, 141] // y de cada carril; ponytail: maximo 3 carriles, mas pide mas alto de riel
// un clon por tramo contiguo en un carril > 0
const runs: { lane: number; from: number; to: number }[] = []
jobs
  .filter((j) => j.lane > 0)
  .forEach((j) => {
    const r = runs.find((q) => q.lane === j.lane && q.to + 1 === j.from)
    if (r) r.to = j.to
    else runs.push({ lane: j.lane, from: j.from, to: j.to })
  })
const lookAt = (lane: number, k: number) => {
  const l = jobs.filter((j) => j.lane === lane)
  return (l.filter((j) => j.from <= k).pop() ?? l[0]).look
}
const others = stages.map((_, k) => jobs.filter((j) => j.from <= k && k <= j.to && j.primary !== k))
// tarjetas compactas: un grupo por tramo de pasos consecutivos con los mismos trabajos extra
const strips: { jobs: J[]; from: number; to: number }[] = []
const stripIdx = others.map((o, k) => {
  if (!o.length) return -1
  const g = strips[strips.length - 1]
  if (g && g.to === k - 1 && g.jobs.map((j) => j.job).join() === o.map((j) => j.job).join()) g.to = k
  else strips.push({ jobs: o, from: k, to: k })
  return strips.length - 1
})
const pct = (k: number) => (Math.min(k, N - 1) * 100) / (N - 1)
const pad = (k: number) => String(k + 1).padStart(2, '0')

export default function Career() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const r = root.current!
      const $ = <T extends HTMLElement>(s: string) => r.querySelector<T>(s)!
      const all = <T extends HTMLElement>(s: string) => gsap.utils.toArray<T>(s, r)
      const track = $('.track')
      const rail = $<HTMLCanvasElement>('.lanes')
      const rg = rail.getContext('2d')!
      const walkers = all('.walker')
      const clones = all('.clone')
      const sprites = walkers.map((el, i) => ({
        dev: el.querySelector<HTMLCanvasElement>('.dev')!,
        gear: el.querySelector<HTMLCanvasElement>('.gear')!,
        lane: i ? runs[i - 1].lane : 0,
        sc: i ? 2 : 3, // el primero es el caminante principal
        look: -1,
        fr: -1,
        off: i * 2,
      }))

      // riel: carriles con diagonales escalonadas; lo recorrido en --p, lo pendiente en --p-dim
      let lp = 1
      let lastLit = -1
      const drawRail = (p: number) => {
        const W = track.clientWidth
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const cw = rail.clientWidth
        const ch = rail.clientHeight
        if (rail.width !== Math.round(cw * dpr) || rail.height !== Math.round(ch * dpr)) {
          rail.width = Math.round(cw * dpr)
          rail.height = Math.round(ch * dpr)
          lastLit = -1
        }
        const lit = p >= 1 ? Infinity : 40 + p * W
        const key = Math.floor(lit)
        if (key === lastLit) return
        lastLit = key
        rg.setTransform(dpr, 0, 0, dpr, 0, 0)
        rg.clearRect(0, 0, cw, ch)
        const cs = getComputedStyle(rail)
        const P = cs.getPropertyValue('--p').trim() || '#33ff66'
        const Dm = cs.getPropertyValue('--p-dim').trim() || '#1fa044'
        const seg = (x0: number, x1: number, y: number) => {
          for (let x = Math.round(x0); x < x1; x += 8) {
            rg.fillStyle = x < lit ? P : Dm
            rg.fillRect(x, y - 1, Math.min(4, x1 - x), 2)
          }
        }
        const diag = (xa: number, ya: number, xb: number, yb: number) => {
          const n = Math.max(1, Math.round(Math.abs(yb - ya) / 3))
          const w = Math.ceil(Math.abs(xb - xa) / n)
          for (let k = 0; k <= n; k++) {
            const x = Math.round(xa + ((xb - xa) * k) / n)
            rg.fillStyle = x < lit ? P : Dm
            rg.fillRect(x, Math.round(ya + ((yb - ya) * k) / n) - 1, w, 3)
          }
        }
        seg(0, cw, LY[0])
        if (!matchMedia('(min-width: 768px)').matches) return
        const FW = (SL / TT) * W
        runs.forEach((q) => {
          const xs = 40 + (q.from / (N - 1)) * W
          const merges = q.to + 1 < N
          const xe = 40 + (Math.min(q.to + 1, N - 1) / (N - 1)) * W - (merges ? (MG / TT) * W : 0)
          diag(xs, LY[0], xs + FW, LY[q.lane])
          seg(xs + FW, merges ? xe - FW : cw, LY[q.lane])
          if (merges) diag(xe - FW, LY[q.lane], xe, LY[0])
        })
      }

      // sprites: cuadro segun progreso; atuendo segun el trabajo de su carril en ese paso
      const paint = (p: number) => {
        lp = p
        const k = Math.min(N - 1, Math.floor(p * (N - 1) + 1e-4))
        const f = Math.floor(p * 44)
        sprites.forEach((sp) => {
          const look = lookAt(sp.lane, k)
          const fr = (f + sp.off) % 4
          if (look === sp.look && fr === sp.fr) return
          draw(sp.dev, S.dev[fr], { s: S.shirts[look] })
          if (look !== sp.look) {
            const gb = S.gear[look]
            sp.gear.style.width = gb[0].length * 2 + 'px'
            sp.gear.style.height = gb.length * 2 + 'px'
            draw(sp.gear, gb)
          }
          sp.dev.style.width = S.dev[0][0].length * sp.sc + 'px'
          sp.dev.style.height = S.dev[0].length * sp.sc + 'px'
          sp.look = look
          sp.fr = fr
        })
      }
      const move = (p: number) => {
        const W = track.clientWidth
        gsap.set(walkers, { x: (i: number) => (p - (i ? lag(i - 1) / TT : 0)) * W })
        paint(p)
        drawRail(p)
      }
      const puffs = all<HTMLCanvasElement>('.puff')
      const paintFx = () => puffs.forEach((c) => draw(c, S.puff))
      paint(1)
      drawRail(1)
      paintFx()
      const repaint = () => {
        paintFx()
        sprites.forEach((sp) => (sp.look = -1))
        lastLit = -1
        paint(lp)
        drawRail(lp)
      }
      const onResize = () => drawRail(lp)
      window.addEventListener('phos', repaint)
      window.addEventListener('resize', onResize)

      const mm = gsap.matchMedia()
      mm.add(
        {
          full: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          lite: '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const full = (ctx.conditions as { full: boolean }).full
          const rows = all('.job-row')
          const sts = all('.stage')
          const barEl = (row: HTMLElement) => row.querySelector<HTMLElement>('.bar')!
          const pctEl = (row: HTMLElement) => row.querySelector<HTMLElement>('.pct')!
          // barra y porcentaje salen de un unico k: celdas llenas == porcentaje mostrado
          const shown: number[] = jobs.map(() => -1)
          const setBar = (i: number, k: number) => {
            if (shown[i] === k) return
            shown[i] = k
            barEl(rows[i]).textContent = bar(k)
            pctEl(rows[i]).textContent = Math.round((k / CELLS) * 100) + '%'
          }
          gsap.set(walkers, { left: 0 })
          const walk = { p: 0 }
          move(0)

          if (!full) {
            gsap.to(walk, {
              p: 1,
              ease: 'none',
              onUpdate: () => move(walk.p),
              scrollTrigger: { trigger: r, start: 'top 60%', end: 'bottom 75%', scrub: 0.6 },
            })
            rows.forEach((row, i) => {
              const o = { n: 0 }
              setBar(i, 0)
              gsap.to(o, {
                n: CELLS,
                duration: 1.2,
                ease: 'none',
                onUpdate: () => setBar(i, Math.round(o.n)),
                scrollTrigger: { trigger: row, start: 'top 90%', once: true },
              })
            })
            sts.forEach((s) =>
              typeOnEnter(s, [s.querySelector('h3 .ty')!, s.querySelector('.st-text .ty')!], 'top 80%'),
            )
            return () => {
              fillTy(r)
              window.dispatchEvent(new Event('phos'))
            }
          }

          // ---------- pinned + scrub ----------
          $('.career-pin').classList.add('is-pinned')
          const panel = $('.career-panel')
          const strs = all('.par')
          const stripAt = (k: number) => (k >= 0 && stripIdx[k] >= 0 ? strs[stripIdx[k]] : null)
          const cards = [...sts, ...strs]
          const cv = $<HTMLCanvasElement>('.dis')
          const g = cv.getContext('2d')!
          // disolucion fina: celdas de CS px, umbral diagonal + trama Bayer 8x8
          const CS = 7
          const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
            3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21]
          const mk = document.createElement('canvas')
          const mg = mk.getContext('2d')!
          const setMask = (el: HTMLElement, url: string, w: number, h: number) => {
            const v = url ? `url(${url})` : ''
            el.style.maskImage = el.style.webkitMaskImage = v
            el.style.maskSize = el.style.webkitMaskSize = url ? `${w}px ${h}px` : ''
            el.style.maskPosition = el.style.webkitMaskPosition = url ? `${-el.offsetLeft}px ${-el.offsetTop}px` : ''
            el.style.maskRepeat = el.style.webkitMaskRepeat = url ? 'no-repeat' : ''
          }
          // estado derivado solo de (i, v): idempotente al saltar o invertir el scrub.
          // Etapas y tarjetas paralelas comparten la misma trama; una tarjeta que sigue entre pasos no se toca.
          const dither = (i: number, v: number) => {
            const w = panel.clientWidth
            const h = panel.clientHeight
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
              cv.width = Math.round(w * dpr)
              cv.height = Math.round(h * dpr)
            }
            g.setTransform(dpr, 0, 0, dpr, 0, 0)
            g.clearRect(0, 0, w, h)
            if (v <= 0 || v >= 1) {
              const k = v <= 0 ? i - 1 : i
              cards.forEach((el) => {
                el.style.visibility = el === sts[k] || el === stripAt(k) ? 'visible' : 'hidden'
                setMask(el, '', 0, 0)
              })
              return
            }
            const sTo = stripAt(i)
            const sFrom = stripAt(i - 1)
            const tos = [sts[i]]
            const froms = i > 0 ? [sts[i - 1]] : []
            if (sTo !== sFrom) {
              if (sTo) tos.push(sTo)
              if (sFrom) froms.push(sFrom)
            }
            const nx = Math.ceil(w / CS)
            const ny = Math.ceil(h / CS)
            mk.width = nx
            mk.height = ny
            const A = mg.createImageData(nx, ny)
            const B = mg.createImageData(nx, ny)
            const P = getComputedStyle(cv).getPropertyValue('--p').trim() || '#33ff66'
            g.fillStyle = P
            const ps = v * 1.25
            for (let y = 0; y < ny; y++)
              for (let x = 0; x < nx; x++) {
                const r = 0.04 + (0.66 * (x + y) * CS) / (w + h) + (0.3 * BAYER[(y % 8) * 8 + (x % 8)]) / 63
                const d = ps - r
                const m = d < 0 ? 0 : Math.min(1, d / 0.16)
                const k = (y * nx + x) * 4 + 3
                B.data[k] = m * 255
                A.data[k] = (1 - m) * 255
                const al = d < -0.07 ? 0 : d < 0 ? 0.05 : d < 0.08 ? 0.34 : d < 0.16 ? 0.2 : d < 0.24 ? 0.08 : 0
                if (al) {
                  g.globalAlpha = al
                  g.fillRect(x * CS, y * CS, CS - 1, CS - 1)
                }
              }
            g.globalAlpha = 1
            const url = (a: ImageData) => {
              mg.putImageData(a, 0, 0)
              return mk.toDataURL()
            }
            const uB = url(B)
            const uA = url(A)
            cards.forEach((el) => {
              const isTo = tos.includes(el)
              const isFrom = froms.includes(el)
              el.style.visibility = isTo || isFrom || (el === sTo && el === sFrom) ? 'visible' : 'hidden'
              setMask(el, isTo ? uB : isFrom ? uA : '', nx * CS, ny * CS)
            })
          }

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: '.career-pin', start: 'top top', end: '+=520%', pin: true, scrub: 0.6, anticipatePin: 1 },
          })
          gsap.set(cards, { visibility: 'hidden' })
          gsap.set(rows, { autoAlpha: 0 })
          gsap.set('.job-head', { autoAlpha: 0 })
          // estado de filas derivado solo del tiempo del scrub (video inverso incluido)
          const mark = () => {
            const t = tl.time()
            const k = Math.min(N - 1, Math.floor((t - T0) / D))
            jobs.forEach((j, i) => {
              rows[i].classList.toggle('on', k >= j.from && k <= j.to)
              rows[i].classList.toggle('pri', k === j.primary)
              rows[i].classList.toggle('done', k > j.to)
              setBar(i, Math.round(CELLS * clamp((t - at(j.from) - 0.3) / ((j.to - j.from + 1) * D - 0.6))))
            })
          }
          tl.eventCallback('onUpdate', mark)
          mark()

          typeTo(tl, $('.cmd1 .ty'), 0, 0.5)
          typeTo(tl, $('.cmd2 .ty'), 0.5, 0.6)
          tl.to('.job-head', { autoAlpha: 1, duration: 0.1 }, 1.1)
          tl.to(walk, { p: 1, duration: (N - 1) * D, onUpdate: () => move(walk.p) }, T0)

          jobs.forEach((j, i) => tl.to(rows[i], { autoAlpha: 1, duration: 0.3, ease: 'steps(3)' }, at(j.from)))

          sts.forEach((s, i) => {
            const a = at(i)
            // disolucion fina entre etapas (progreso con easing; la mascara depende solo de v)
            const dis = { v: 0 }
            tl.to(dis, { v: 1, duration: 1, ease: 'power2.inOut', onUpdate: () => dither(i, dis.v) }, a + 0.1)
            typeTo(tl, s.querySelector('h3 .ty'), a + 0.3, 0.35)
            typeTo(tl, s.querySelector('.st-text .ty'), a + 0.4, 0.7)
            s.querySelectorAll('li .ty').forEach((li, k) => typeTo(tl, li, a + 0.9 + k * 0.2, 0.3))
          })

          // clones: nacen en el tronco, bajan a su carril (pasos de 3px), vuelven y se funden
          const puff = (el: HTMLElement, t: number) => {
            tl.fromTo(el, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'steps(3)' }, t)
            tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'steps(3)', immediateRender: false }, t + 0.2)
          }
          runs.forEach((q, ri) => {
            const el = clones[ri]
            const dy = LY[q.lane] - LY[0]
            const ease = `steps(${Math.round(dy / 3)})`
            const a = at(q.from) + lag(ri)
            const e = at(q.to + 1) + lag(ri) - (q.to + 1 < N ? MG : 0)
            tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'steps(2)' }, a)
            tl.fromTo(el, { y: 0 }, { y: dy, duration: SL, ease }, a)
            tl.fromTo(el, { y: dy }, { y: 0, duration: SL, ease, immediateRender: false }, e - SL)
            tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ease: 'steps(2)', immediateRender: false }, e - 0.2)
            puff(puffs[ri * 2], a)
            puff(puffs[ri * 2 + 1], e - 0.2)
          })
          tl.to({}, { duration: 0.6 }, at(N - 1) + 2.9)

          return () => {
            fillTy(r)
            rows.forEach((row, i) => {
              row.classList.toggle('on', jobs[i].to >= N - 1)
              row.classList.toggle('pri', jobs[i].primary === N - 1)
              row.classList.toggle('done', jobs[i].to < N - 1)
              shown[i] = -1
              setBar(i, CELLS)
            })
            g.clearRect(0, 0, cv.width, cv.height)
            cards.forEach((el) => {
              el.style.visibility = ''
              setMask(el, '', 0, 0)
            })
            $('.career-pin').classList.remove('is-pinned')
            window.dispatchEvent(new Event('phos'))
          }
        },
      )
      return () => {
        mm.revert()
        window.removeEventListener('phos', repaint)
        window.removeEventListener('resize', onResize)
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} id="historia" className="sec career" aria-labelledby="h-career">
      <div className="career-pin">
        <div className="career-head">
          <h2 id="h-career" className="scr-title">
            Work with Active Jobs
          </h2>
          <p className="dim center">Historia: cinco etapas, de WordPress a Full Stack Semi Senior AI-first.</p>
          <div className="cmds">
            <p className="cmdl cmd1">
              <span className="dim">===&gt;</span> <Ty t="WRKACTJOB" className="c-white" />
            </p>
            <p className="cmdl cmd2">
              <span className="dim">===&gt;</span> <Ty t="CALL PGM(CAREER)" className="c-white" />
            </p>
          </div>
          <ul className="sr-only">
            {stages.map((s, k) => (
              <li key={s.job}>
                {`Paso ${k + 1}: ${s.title}`}
                {others[k].length ? `. Activos en paralelo: ${others[k].map((j) => j.title).join(', ')}.` : ''}
              </li>
            ))}
          </ul>
        </div>

        <div className="career-grid">
          <div className="jobs">
            <div className="job-head dim" aria-hidden="true">
              <span>Opt Job</span>
              <span>User</span>
              <span>Subsys</span>
              <span>Status</span>
              <span>Progress</span>
            </div>
            <ol>
              {jobs.map((j) => (
                <li key={j.job} className={'job-row' + (j.to >= N - 1 ? ' on' : ' done') + (j.primary === N - 1 ? ' pri' : '')}>
                  <span className="c-white">
                    <span className="opt-n">5</span> {j.job}
                    <span className="dim"> {j.num}</span>
                  </span>
                  <span>{j.user}</span>
                  <span className="c-cyan">{j.sub}</span>
                  <span className="status">
                    <span className="st-a c-yellow">ACTIVE</span>
                    <span className="st-c c-pink">CMPLD</span>
                  </span>
                  <span className="prog">
                    <span className="bar" aria-hidden="true">
                      {bar(CELLS)}
                    </span>
                    <span className="pct" aria-hidden="true">
                      100%
                    </span>
                  </span>
                  <span className="job-t">{j.title}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="career-panel">
            <div className="stages">
              {stages.map((s, i) => (
                <article key={s.title} className={'stage' + (others[i].length ? ' has-par' : '')}>
                  <p className="px c-cyan lab">
                    STEP 0{i + 1}/05 - {s.job}
                  </p>
                  <h3>
                    <Ty t={s.title} block />
                  </h3>
                  <p className="st-text">
                    <Ty t={s.text} block />
                  </p>
                  <ul>
                    {s.points.map((p) => (
                      <li key={p}>
                        <span className="c-yellow" aria-hidden="true">
                          &gt;{' '}
                        </span>
                        <Ty t={p} block />
                      </li>
                    ))}
                  </ul>
                  {others[i].length > 0 && (
                    <p className="also dim">También activo: {others[i].map((j) => j.title).join(', ')}</p>
                  )}
                </article>
              ))}
            </div>
            <div className="par-wrap">
              {strips.map((g) => (
                <div key={g.from} className="par">
                  <p className="px dim par-lab">
                    EN PARALELO {pad(g.from)}-{pad(g.to)}
                  </p>
                  <div className="par-cards">
                    {g.jobs.map((j) => (
                      <div key={j.job} className="pcard">
                        <p className="px lab">
                          <span className="c-cyan">{j.job}</span> <span className="c-yellow">ACTIVE</span>
                        </p>
                        <h4>{j.title}</h4>
                        <p className="pc-t">{j.short ?? j.text}</p>
                        <span className="sr-only">
                          {j.text} {j.points.join('. ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <canvas className="dis" aria-hidden="true" />
          </div>
        </div>

        <div className="rail" aria-hidden="true">
          <div className="track">
            <canvas className="lanes" />
            {jobs.map((j) => (
              <span key={j.job} className={'px jl' + (j.from === 0 ? ' first' : '')} style={{ left: `${pct(j.from)}%`, top: LY[j.lane] }}>
                {j.job}
              </span>
            ))}
            <div className="walker main">
              <canvas className="gear pxl" />
              <canvas className="dev pxl" />
            </div>
            {runs.map((q) => (
              <div key={q.lane + '-' + q.from} className="walker clone" style={{ top: LY[0] - 28 }}>
                <canvas className="gear pxl" />
                <canvas className="dev pxl" />
              </div>
            ))}
            {runs.flatMap((q) => [
              <canvas key={q.lane + 'f'} className="puff pxl" style={{ left: `${pct(q.from)}%` }} />,
              <canvas key={q.lane + 'm'} className="puff pxl" style={{ left: `${pct(q.to + 1) - ((MG + 0.2) / TT) * 100}%` }} />,
            ])}
          </div>
        </div>
      </div>
    </section>
  )
}

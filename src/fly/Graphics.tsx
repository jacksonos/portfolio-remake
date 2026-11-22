import { gsap } from '../lib/scroll'
import { fly } from '../content'

// Tres graficos centrales del vuelo (ilustraciones, linea fina). El estado DOM por defecto es el cuadro FINAL
// (movil, movimiento reducido). En el vuelo, Fly.tsx pide progress(t) a cada linea de tiempo (pausada): estado
// puro del scroll, reversible, nunca en bucle. Cada build() se llama dentro del matchMedia de escritorio.

export type TL = gsap.core.Timeline
export const tline = () => gsap.timeline({ paused: true, defaults: { ease: 'none' } })
export const pad = (tl: TL) => tl.to({}, { duration: 0 }, 1) // la linea dura exactamente 1

// ------------------------------------------------------------------ 1. decimal empaquetado (estacion 1)
const DIG = ['0', '0', '0', '0', '1', '2', '3', '4', '5', '6', '7']
const BX = (b: number) => 8.5 + 43 * b // x del byte b (ancho 38)
const nibX = (k: number) => BX(k >> 1) + (k % 2 ? 28.5 : 9.5)
const srcX = (k: number) => (k <= 8 ? 21 + 22 * k : 229 + 22 * (k - 9)) // fila origen: el hueco es la V
const Y_SRC = 52
const Y_DST = 134.5
const HEX = ['00', '00', '12', '34', '56', '7C']
const RULER = Array.from({ length: 80 }, (_, c) => `M${(c * 3.38 + 0.5).toFixed(2)} 12v${c % 10 === 0 ? -9 : -4}`).join('')

export function PackGfx() {
  const p = fly.pack
  return (
    <div className="gx-zone gx-zone-0">
      <figure className="gx gx-pack" role="img" aria-label={p.label}>
        <p className="gx-tag" aria-hidden="true">{fly.tag} · {p.note}</p>
        <svg viewBox="0 0 270 184" aria-hidden="true">
          <text className="gx-t gx-sample" x="0" y="14">{p.sample}</text>
          <g className="gx-v">
            <path className="gx-s" d="M199.5 98V112" />
            <text className="gx-t gx-vlabel" x="199.5" y="92" textAnchor="middle">V</text>
          </g>
          <text className="gx-t gx-dot" x="262" y="76" textAnchor="end">{p.dot}</text>
          {HEX.map((_, b) => (
            <rect key={b} className="gx-s gx-box" x={BX(b)} y="112" width="38" height="34" />
          ))}
          <path className="gx-s gx-faint gx-div" d={HEX.map((_, b) => `M${BX(b) + 19} 112v34`).join('')} />
          <rect className="gx-s gx-acc gx-signbox" x={BX(5) + 19} y="112" width="19" height="34" />
          {DIG.map((d, k) => (
            <text key={k} className="gx-t gx-dig" data-k={k} x={nibX(k)} y={Y_DST} textAnchor="middle">{d}</text>
          ))}
          <text className="gx-t gx-dig gx-sign" x={nibX(11)} y={Y_DST} textAnchor="middle">C</text>
          {HEX.map((h, b) => (
            <text key={b} className="gx-t gx-hex" x={BX(b) + 19} y="170" textAnchor="middle">{h}</text>
          ))}
        </svg>
        <p className="gx-cap" aria-hidden="true">{p.caption}</p>
        <svg className="gx-ruler" viewBox="0 0 270 14" aria-hidden="true">
          <path className="gx-s gx-faint" d={RULER} />
        </svg>
        <p className="gx-note gx-note-ruler" aria-hidden="true">{p.ruler}</p>
      </figure>
    </div>
  )
}

export function buildPack(root: HTMLElement): TL {
  const q = <T extends Element>(s: string) => root.querySelector<T>(s)!
  const qa = (s: string) => Array.from(root.querySelectorAll<SVGElement>(s))
  const tl = tline()
  tl.from([q('.gx-tag'), q('.gx-sample')], { opacity: 0, duration: 0.08 }, 0)
  const digs = qa('.gx-dig[data-k]')
  digs.forEach((d, k) => {
    const pair = k >> 1 // 0..5
    const at = 0.1 + 0.11 * pair + (k % 2 ? 0.015 : 0)
    tl.from(d, { opacity: 0, duration: 0.08 }, 0.02 + 0.006 * k)
    tl.from(d, { x: srcX(k) - nibX(k), y: Y_SRC - Y_DST, duration: 0.16, ease: 'power2.inOut' }, at)
  })
  // la V viaja con los digitos y no ocupa ningun medio byte
  tl.from(q('.gx-v'), { opacity: 0, duration: 0.08 }, 0.04)
  tl.from(q('.gx-v'), { x: 213 - 199.5, y: 42 - 105, duration: 0.16, ease: 'power2.inOut' }, 0.54)
  qa('.gx-box').forEach((b, i) => tl.from(b, { drawSVG: '0%', duration: 0.12 }, 0.1 + 0.11 * i))
  tl.from(q('.gx-div'), { drawSVG: '0%', duration: 0.12 }, 0.7)
  tl.from(q('.gx-dot'), { opacity: 0, duration: 0.08 }, 0.76)
  // el signo, al final y en el acento
  tl.from(q('.gx-sign'), { opacity: 0, duration: 0.08 }, 0.84)
  tl.from(q('.gx-signbox'), { drawSVG: '0%', duration: 0.1 }, 0.84)
  tl.from(qa('.gx-hex'), { opacity: 0, duration: 0.06, stagger: 0.015 }, 0.9)
  tl.from([q('.gx-cap'), q('.gx-ruler'), q('.gx-note-ruler')], { opacity: 0, duration: 0.08 }, 0.92)
  return pad(tl)
}

// ------------------------------------------------------------------ 3. la rodilla de la curva (estacion 3)
const RAMP = Array.from({ length: 8 }, (_, k) => `${k ? `V${318 - 6 * k}` : 'M54 318'}H${k === 7 ? 480 : (54 + 53.25 * (k + 1)).toFixed(2)}`).join('')

export function KneeGfx() {
  const k = fly.knee
  return (
    <div className="gx-zone gx-zone-2">
      <figure className="gx gx-knee" role="img" aria-label={k.label}>
        <p className="gx-tag" aria-hidden="true">{fly.tag} · {k.note}</p>
        <svg viewBox="0 0 540 340" aria-hidden="true">
          <path className="gx-s gx-axis" d="M54 14V262H480" />
          <path className="gx-s gx-faint gx-arrows" d="M48 22L54 14L60 22M472.4 256L480 262L472.4 268" />
          <text className="gx-t gx-ylab" transform="rotate(-90 16 138)" x="16" y="138" textAnchor="middle">{k.y}</text>
          <text className="gx-t gx-xlab" x="480" y="334" textAnchor="end">{k.x}</text>
          <path className="gx-s gx-acc gx-ramp" d={RAMP} />
          <path className="gx-s gx-faint gx-thr" d="M54 120H480" />
          <text className="gx-t gx-thrlab" x="486" y="124">{k.threshold}</text>
          <path className="gx-s gx-resp" d="M54 236C135.4 236 249 234 324.8 228C367.4 223 410 152 446 36" />
          <path className="gx-s gx-faint gx-cap-line" d="M60 202H330.5M60 196V208M330.5 196V208" />
          <text className="gx-t gx-cap-lab" x="195" y="192" textAnchor="middle">{k.capacity}</text>
          <circle className="gx-s gx-acc gx-knee-dot" cx="343.7" cy="221" r="3.4" />
          <path className="gx-s gx-acc gx-knee-lead" d="M343.7 215V178" />
          <text className="gx-t gx-acc-t gx-knee-lab" x="338" y="172" textAnchor="end">{k.knee}</text>
        </svg>
      </figure>
    </div>
  )
}

export function buildKnee(root: HTMLElement): TL {
  const q = <T extends Element>(s: string) => root.querySelector<T>(s)!
  const tl = tline()
  tl.from(q('.gx-tag'), { opacity: 0, duration: 0.08 }, 0)
  tl.from(q('.gx-axis'), { drawSVG: '0%', duration: 0.1 }, 0)
  tl.from([q('.gx-arrows'), q('.gx-ylab'), q('.gx-xlab')], { opacity: 0, duration: 0.08 }, 0.08)
  tl.from([q('.gx-thr'), q('.gx-thrlab')], { opacity: 0, duration: 0.1 }, 0.1)
  tl.from(q('.gx-ramp'), { drawSVG: '0%', duration: 0.7 }, 0.12) // la rampa y la curva avanzan juntas
  tl.from(q('.gx-resp'), { drawSVG: '0%', duration: 0.7 }, 0.12)
  tl.from(q('.gx-knee-dot'), { opacity: 0, scale: 0.4, svgOrigin: '343.7 221', duration: 0.06 }, 0.5)
  tl.from(q('.gx-knee-lead'), { drawSVG: '0%', duration: 0.07 }, 0.54)
  tl.from(q('.gx-knee-lab'), { opacity: 0, duration: 0.07 }, 0.58)
  tl.from(q('.gx-cap-line'), { drawSVG: '0%', duration: 0.1 }, 0.86)
  tl.from(q('.gx-cap-lab'), { opacity: 0, duration: 0.08 }, 0.9)
  return pad(tl)
}

// ------------------------------------------------------------------ 5. bucle con humano (estacion 5)
const YA = [44, 76, 108, 140, 172, 204]
const YB = [272, 306, 340, 374, 408]
const SX = 40 // x de la columna vertebral

export function LoopGfx() {
  const l = fly.loop
  return (
    <div className="gx-zone gx-zone-4">
      <figure className="gx gx-loop" role="img" aria-label={l.label}>
        <p className="gx-tag" aria-hidden="true">{fly.tag} · {l.note}</p>
        <svg viewBox="0 0 240 430" aria-hidden="true">
          <text className="gx-t gx-head gx-hA" x="0" y="12">{l.dev}</text>
          <path className="gx-s gx-faint gx-rule gx-ruleA" d="M0 20H240" />
          <path className="gx-s gx-spine gx-spineA" d={`M${SX} ${YA[0]}V${YA[5]}`} />
          <path className="gx-s gx-acc gx-loopback" d="M36 140C6 140 6 108 36 108M29.5 102.5L36 108L29.5 113.5" />
          {l.devSteps.map((s, i) => (
            <g key={s} className="gx-node gx-nA" data-i={i}>
              <rect className="gx-s" x={SX - 4} y={YA[i] - 4} width="8" height="8" />
              <text className="gx-t gx-lab" x="54" y={YA[i] + 4}>{s}</text>
            </g>
          ))}
          <text className="gx-t gx-head gx-hB" x="0" y="240">{l.prod}</text>
          <path className="gx-s gx-faint gx-rule gx-ruleB" d="M0 248H240" />
          <path className="gx-s gx-spine gx-spineB1" d={`M${SX} ${YB[0]}V${YB[2]}`} />
          <path className="gx-s gx-spine gx-spineB2" d={`M${SX} ${YB[2]}V${YB[4]}`} />
          {l.prodSteps.map((s, i) => (
            <g key={s} className="gx-node gx-nB" data-i={i}>
              {i === 2 ? (
                <path className="gx-s gx-acc" d={`M${SX} ${YB[2] - 8}L${SX + 7} ${YB[2]}L${SX} ${YB[2] + 8}L${SX - 7} ${YB[2]}Z`} />
              ) : (
                <rect className="gx-s" x={SX - 4} y={YB[i] - 4} width="8" height="8" />
              )}
              <text className="gx-t gx-lab" x="54" y={YB[i] + 4}>{s}</text>
            </g>
          ))}
          <circle className="gx-s gx-acc gx-ring" cx={SX} cy={YB[2]} r="11" />
          <text className="gx-t gx-acc-t gx-ok" x="54" y={YB[3] + 17}>{l.approved}</text>
          <circle className="gx-tok gx-tokA" cx={SX} cy={YA[5]} r="3.6" />
          <circle className="gx-tok gx-tokB" cx={SX} cy={YB[4]} r="3.6" />
        </svg>
        <p className="gx-note gx-note-human" aria-hidden="true">{l.margin}</p>
      </figure>
    </div>
  )
}

export function buildLoop(root: HTMLElement): TL {
  const q = <T extends Element>(s: string) => root.querySelector<T>(s)!
  const qa = (s: string) => Array.from(root.querySelectorAll<SVGElement>(s))
  const tl = tline()
  // el token es un circulo en su posicion FINAL; cada tramo es fromTo con desplazamientos relativos a ella
  const leg = (tok: Element, ys: [number, number], end: number, at: number, dur: number, first = false) =>
    tl.fromTo(tok, { y: ys[0] - end }, { y: ys[1] - end, duration: dur, immediateRender: first }, at)
  const A = q('.gx-tokA')
  const B = q('.gx-tokB')
  const eA = YA[5]
  const eB = YB[4]
  const nA = qa('.gx-nA')
  const nB = qa('.gx-nB')

  tl.from(q('.gx-tag'), { opacity: 0, duration: 0.06 }, 0)
  tl.from([q('.gx-hA'), q('.gx-ruleA')], { opacity: 0, duration: 0.06 }, 0.02)
  // carril A: desarrollo
  tl.from(q('.gx-spineA'), { drawSVG: '0%', duration: 0.46 }, 0.06)
  const aAt = [0.06, 0.13, 0.2, 0.27, 0.43, 0.5]
  nA.forEach((n, i) => tl.from(n, { opacity: 0, duration: 0.05 }, aAt[i]))
  tl.from(A, { opacity: 0, duration: 0.03 }, 0.06)
  leg(A, [YA[0], YA[0]], eA, 0.06, 0.001, true)
  leg(A, [YA[0], YA[1]], eA, 0.08, 0.05)
  leg(A, [YA[1], YA[2]], eA, 0.15, 0.05)
  leg(A, [YA[2], YA[3]], eA, 0.22, 0.05)
  // contrapropuesta: el token vuelve a la propuesta por el arco
  tl.from(q('.gx-loopback'), { drawSVG: '0%', duration: 0.09 }, 0.29)
  tl.fromTo(A, { x: 0 }, { x: -25, duration: 0.045, ease: 'sine.out', immediateRender: false }, 0.29)
  tl.fromTo(A, { x: -25 }, { x: 0, duration: 0.045, ease: 'sine.in', immediateRender: false }, 0.335)
  tl.fromTo(A, { y: YA[3] - eA }, { y: YA[2] - eA, duration: 0.09, immediateRender: false }, 0.29)
  leg(A, [YA[2], YA[4]], eA, 0.39, 0.06)
  leg(A, [YA[4], YA[5]], eA, 0.46, 0.05)
  // carril B: produccion, con compuerta
  tl.from([q('.gx-hB'), q('.gx-ruleB')], { opacity: 0, duration: 0.06 }, 0.54)
  tl.from(q('.gx-spineB1'), { drawSVG: '0%', duration: 0.15 }, 0.58)
  tl.from(B, { opacity: 0, duration: 0.03 }, 0.58)
  leg(B, [YB[0], YB[0]], eB, 0.58, 0.001, true)
  leg(B, [YB[0], YB[1]], eB, 0.61, 0.05)
  leg(B, [YB[1], YB[2]], eB, 0.68, 0.05)
  const bAt = [0.58, 0.63, 0.7, 0.76, 0.95]
  nB.forEach((n, i) => tl.from(n, { opacity: 0, duration: 0.05 }, bAt[i]))
  // espera en la compuerta: el anillo se completa con el scroll; al pasar el umbral, 'aprobado' y el token sigue
  tl.from(q('.gx-ring'), { drawSVG: '0%', duration: 0.13 }, 0.74)
  tl.from(q('.gx-ok'), { opacity: 0, duration: 0.04 }, 0.88)
  tl.from(q('.gx-spineB2'), { drawSVG: '0%', duration: 0.085 }, 0.9)
  leg(B, [YB[2], YB[3]], eB, 0.9, 0.04)
  leg(B, [YB[3], YB[4]], eB, 0.95, 0.045)
  tl.from(q('.gx-note-human'), { opacity: 0, duration: 0.06 }, 0.88)
  return pad(tl)
}

import { fly } from '../content'
import { pad, tline, type TL } from './Graphics'

// Estacion 2: el monolito bajo la lupa. Tres tramos por scroll (t = 0..1): descubrir (el asistente sigue una
// transaccion modulo a modulo), medir (puntos calientes) y optimizar (recorrido completo -> busqueda indexada).
// Ilustracion con nombres de modulo genericos y sin cifras. El DOM por defecto es el cuadro FINAL.

const MBX = (c: number) => 9 + 86 * c // x de la columna c (cajas de 78 x 36)
const MBY = (r: number) => 72 + 45 * r
const MC = (c: number, r: number): [number, number] => [MBX(c) + 39, MBY(r) + 18]
const TRACE_CELLS: [number, number][] = [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1], [4, 2], [3, 2], [2, 2], [2, 3], [3, 3], [4, 3]]
const TP = TRACE_CELLS.map(([c, r]) => MC(c, r))
const TRACE_D = `M${TP.map(([x, y]) => `${x} ${y}`).join('L')}`
const HOT: [number, number][] = [[2, 1], [4, 2], [2, 3]]
const HATCH = (c: number, r: number) => {
  // diagonales a 45 grados recortadas a la caja
  const x = MBX(c), y = MBY(r), w = 78, h = 36
  let d = ''
  for (let o = 12; o < w + h - 6; o += 12) {
    d += `M${x + Math.min(o, w)} ${y + h - Math.max(0, o - w)}L${x + Math.max(0, o - h)} ${y + Math.max(0, h - o)}`
  }
  return d
}
// mirada del asistente: el visor mira hacia un punto (funcion pura de la posicion)
const MARK_C: [number, number] = [32, 26]
const gaze = (x: number, y: number): [number, number] => {
  const dx = x - MARK_C[0], dy = y - MARK_C[1], n = Math.hypot(dx, dy) || 1
  return [(6.5 * dx) / n, (3.5 * dy) / n]
}
const AFTER_C: [number, number] = [300, 346]
const GAZE_END = gaze(AFTER_C[0], AFTER_C[1])
const PY = [312, 329, 346, 363, 380] // filas de puntos (antes / despues)
const BAR_Y = [432, 441, 450]
const BAR_FULL = [424, 376, 400]
const BAR_SHORT = [196, 158, 176]

export function MonoGfx() {
  const m = fly.mono
  const end = TP[TP.length - 1]
  return (
    <div className="gx-zone gx-zone-1">
      <figure className="gx gx-mono" role="img" aria-label={m.label}>
        <p className="gx-tag" aria-hidden="true">{fly.tag} · {m.note}</p>
        <svg viewBox="0 0 440 458" aria-hidden="true">
          <g transform="translate(4 6)">
            <path className="gx-s gx-acc gx-m-head" d="M21 2H35A15 15 0 0 1 50 17V27A15 15 0 0 1 35 42H21A15 15 0 0 1 6 27V17A15 15 0 0 1 21 2Z" />
            <path className="gx-s gx-acc gx-m-ears" d="M6 16H3A3 3 0 0 0 0 19V27A3 3 0 0 0 3 30H6M50 16H53A3 3 0 0 1 56 19V27A3 3 0 0 1 53 30H50" />
            <path className="gx-s gx-faint gx-m-visor" d="M21 10H35A9 9 0 0 1 44 19V23A9 9 0 0 1 35 32H21A9 9 0 0 1 12 23V19A9 9 0 0 1 21 10Z" />
            <g transform={`translate(${GAZE_END[0].toFixed(2)} ${GAZE_END[1].toFixed(2)})`}>
              <g className="gx-eyes">
                <path className="gx-m-eye" d="M22 16V26" />
                <path className="gx-m-eye" d="M34 16V26" />
              </g>
            </g>
          </g>
          <text className="gx-t gx-m-name" x="72" y="26">{m.assistant}</text>
          <text className="gx-t gx-m-sub" x="72" y="43">{m.assistantNote}</text>
          {m.phases.map((p, i) => (
            <text key={p} className={`gx-t gx-acc-t gx-ph gx-ph${i}`} x="436" y="26" textAnchor="end">{p}</text>
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <rect key={i} className="gx-s gx-mod" x={MBX(i % 5)} y={MBY(Math.floor(i / 5))} width="78" height="36" />
          ))}
          {Object.entries(m.modules).map(([k, v]) => {
            const [c, r] = k.split(',').map(Number)
            return <text key={k} className="gx-t gx-modlab" x={MBX(c) + 6} y={MBY(r) + 13}>{v}</text>
          })}
          <path className="gx-s gx-acc gx-trace" d={TRACE_D} />
          {HOT.map(([c, r]) => (
            <g key={`${c}${r}`} className="gx-hot">
              <rect className="gx-s gx-acc gx-hot-ring" x={MBX(c) - 3} y={MBY(r) - 3} width="84" height="42" />
              <path className="gx-s gx-acc gx-faint gx-hot-hatch" d={HATCH(c, r)} />
            </g>
          ))}
          <path className="gx-s gx-acc gx-hot-lead" d={`M${MC(2, 3)[0]} ${MBY(3) + 40}V${MBY(3) + 46}`} />
          <text className="gx-t gx-acc-t gx-hot-lab" x={MC(2, 3)[0]} y={MBY(3) + 59} textAnchor="middle">{m.hot}</text>
          <g transform={`translate(${end[0]} ${end[1]})`}>
            <g className="gx-node-ai">
              <circle className="gx-s gx-acc gx-faint" r="7" />
              <circle className="gx-tok" r="3.4" />
            </g>
          </g>
          <text className="gx-t gx-ba" x="8" y="298">{m.before}</text>
          <text className="gx-t gx-ba" x="246" y="298">{m.after}</text>
          <g className="gx-before">
            {PY.map((y) => (
              <path key={y} className="gx-s gx-faint gx-bl" d={PY.map((y2) => `M8 ${y}L118 ${y2}`).join('')} />
            ))}
            {PY.map((y) => (
              <g key={y} className="gx-pt">
                <circle className="gx-s" cx="8" cy={y} r="2.2" />
                <circle className="gx-s" cx="118" cy={y} r="2.2" />
              </g>
            ))}
          </g>
          <text className="gx-t gx-lab-b" x="8" y="402">{m.full}</text>
          <g className="gx-after">
            {PY.map((y) => (
              <path key={y} className="gx-s gx-acc gx-al" d={`M246 ${y}L352 346`} />
            ))}
            {PY.map((y) => (
              <circle key={y} className="gx-s gx-ap" cx="246" cy={y} r="2.2" />
            ))}
            <rect className="gx-s gx-acc gx-idx" x="352" y="342" width="8" height="8" />
            <text className="gx-t gx-idxlab" x="368" y="350">{m.index}</text>
          </g>
          <text className="gx-t gx-acc-t gx-lab-a" x="246" y="402">{m.indexed}</text>
          <g className="gx-formula">
            <path className="gx-s gx-faint" d="M140 336H216M210 331L216 336L210 341" />
            <text className="gx-t gx-acc-t" x="178" y="364" textAnchor="middle">{m.formula}</text>
          </g>
          <text className="gx-t gx-bat-lab" x="8" y="424">{m.batch}</text>
          {BAR_Y.map((y, i) => (
            <g key={y}>
              <rect className="gx-s gx-faint gx-bar-ghost" x="8" y={y} width={BAR_FULL[i]} height="5" />
              <rect className="gx-s gx-acc gx-bar" x="8" y={y} width={BAR_SHORT[i]} height="5" data-i={i} />
            </g>
          ))}
        </svg>
      </figure>
    </div>
  )
}

export function buildMono(root: HTMLElement): TL {
  const q = <T extends Element>(s: string) => root.querySelector<T>(s)!
  const qa = (s: string) => Array.from(root.querySelectorAll<SVGElement>(s))
  const tl = tline()
  const T0 = 0.18, T1 = 0.52 // tramo del escaneo: la traza se dibuja y el nodo avanza
  const lens: number[] = []
  let tot = 0
  for (let i = 1; i < TP.length; i++) {
    const l = Math.abs(TP[i][0] - TP[i - 1][0]) + Math.abs(TP[i][1] - TP[i - 1][1])
    lens.push(l)
    tot += l
  }
  const end = TP[TP.length - 1]
  // el asistente se arma al empezar
  tl.from(q('.gx-tag'), { opacity: 0, duration: 0.06 }, 0)
  tl.from(q('.gx-m-head'), { drawSVG: '0%', duration: 0.1 }, 0)
  tl.from(q('.gx-m-ears'), { drawSVG: '0%', duration: 0.06 }, 0.07)
  tl.from(q('.gx-m-visor'), { drawSVG: '0%', duration: 0.07 }, 0.08)
  tl.from(qa('.gx-m-eye'), { drawSVG: '50% 50%', duration: 0.05, stagger: 0.015 }, 0.13)
  tl.from([q('.gx-m-name'), q('.gx-m-sub')], { opacity: 0, duration: 0.06 }, 0.08)
  // modulos
  qa('.gx-mod').forEach((b, i) => tl.from(b, { drawSVG: '0%', duration: 0.07 }, 0.02 + 0.006 * i))
  tl.from(qa('.gx-modlab'), { opacity: 0, duration: 0.05 }, 0.15)
  // 1. descubrir
  tl.fromTo(q('.gx-ph0'), { opacity: 0 }, { opacity: 1, duration: 0.04, immediateRender: false }, 0.14)
  tl.fromTo(q('.gx-ph0'), { opacity: 1 }, { opacity: 0, duration: 0.04, immediateRender: false }, 0.5)
  tl.from(q('.gx-trace'), { drawSVG: '0%', duration: T1 - T0 }, T0)
  // nodo del asistente y su mirada: reposo = ultimo modulo / mirada al resultado; antes, desplazamientos relativos
  const node = q('.gx-node-ai')
  const eyes = q('.gx-eyes')
  const rel = (x: number, y: number) => {
    const g = gaze(x, y)
    return { x: g[0] - GAZE_END[0], y: g[1] - GAZE_END[1] }
  }
  tl.fromTo(node, { opacity: 0, x: TP[0][0] - end[0], y: TP[0][1] - end[1] }, { opacity: 1, duration: 0.03, immediateRender: true }, T0 - 0.03)
  tl.fromTo(eyes, rel(TP[0][0], TP[0][1]), { ...rel(TP[0][0], TP[0][1]), duration: 0.001, immediateRender: true }, 0.12)
  let L = 0
  for (let i = 0; i < lens.length; i++) {
    const a = TP[i], b = TP[i + 1]
    const at = T0 + (L / tot) * (T1 - T0), dur = (lens[i] / tot) * (T1 - T0)
    tl.fromTo(node, { x: a[0] - end[0], y: a[1] - end[1] }, { x: b[0] - end[0], y: b[1] - end[1], duration: dur, immediateRender: false }, at)
    for (let k = 0; k < 3; k++) {
      // la mirada sigue al nodo (tres tramos por trazo)
      const p0 = rel(a[0] + ((b[0] - a[0]) * k) / 3, a[1] + ((b[1] - a[1]) * k) / 3)
      const p1 = rel(a[0] + ((b[0] - a[0]) * (k + 1)) / 3, a[1] + ((b[1] - a[1]) * (k + 1)) / 3)
      tl.fromTo(eyes, p0, { ...p1, duration: dur / 3, immediateRender: false }, at + (dur * k) / 3)
    }
    L += lens[i]
  }
  // 2. medir
  tl.fromTo(q('.gx-ph1'), { opacity: 0 }, { opacity: 1, duration: 0.04, immediateRender: false }, 0.54)
  tl.fromTo(q('.gx-ph1'), { opacity: 1 }, { opacity: 0, duration: 0.04, immediateRender: false }, 0.69)
  qa('.gx-hot').forEach((h, i) => {
    tl.from(h.querySelector('.gx-hot-ring')!, { drawSVG: '0%', duration: 0.06 }, 0.54 + 0.055 * i)
    tl.from(h.querySelector('.gx-hot-hatch')!, { drawSVG: '0%', duration: 0.05 }, 0.58 + 0.055 * i)
  })
  tl.from(q('.gx-hot-lead'), { drawSVG: '0%', duration: 0.03 }, 0.64)
  tl.from(q('.gx-hot-lab'), { opacity: 0, duration: 0.05 }, 0.66)
  // 3. optimizar
  tl.fromTo(q('.gx-ph2'), { opacity: 0 }, { opacity: 1, duration: 0.04, immediateRender: true }, 0.72)
  tl.from(qa('.gx-ba'), { opacity: 0, duration: 0.05 }, 0.7)
  tl.from(qa('.gx-pt'), { opacity: 0, duration: 0.05 }, 0.71)
  qa('.gx-bl').forEach((p, i) => tl.from(p, { drawSVG: '0%', duration: 0.05 }, 0.73 + 0.012 * i))
  tl.from(q('.gx-lab-b'), { opacity: 0, duration: 0.05 }, 0.78)
  tl.from(qa('.gx-ap, .gx-idx'), { opacity: 0, duration: 0.05 }, 0.79)
  qa('.gx-al').forEach((p, i) => tl.from(p, { drawSVG: '0%', duration: 0.05 }, 0.81 + 0.01 * i))
  tl.from([q('.gx-idxlab'), q('.gx-lab-a')], { opacity: 0, duration: 0.05 }, 0.86)
  tl.from(q('.gx-formula'), { opacity: 0, duration: 0.06 }, 0.88)
  tl.from([q('.gx-bat-lab'), ...qa('.gx-bar-ghost, .gx-bar')], { opacity: 0, duration: 0.05 }, 0.82)
  qa('.gx-bar').forEach((b, i) =>
    tl.fromTo(b, { attr: { width: BAR_FULL[i] } }, { attr: { width: BAR_SHORT[i] }, duration: 0.09, immediateRender: true }, 0.9 + 0.025 * i),
  )
  // la mirada pasa al resultado
  tl.fromTo(eyes, rel(end[0], end[1]), { x: 0, y: 0, duration: 0.1, immediateRender: false }, 0.76)
  return pad(tl)
}

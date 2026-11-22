import { fly } from '../content'

const GLYPHS = '0123456789ABCDEF*+=<>XV9'
// Generador determinista (mismo resultado en cada render).
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const fieldRows = (() => {
  const r = rng(7)
  return Array.from({ length: 11 }, () =>
    Array.from({ length: 34 }, () => (r() < 0.16 ? ' ' : GLYPHS[Math.floor(r() * GLYPHS.length)])).join(''),
  )
})()

/** Estacion 1: campo de caracteres y la comparacion float / decimal. */
export function CobolVis() {
  return (
    <div className="st-vis vis-cobol" aria-hidden="true">
      <pre className="vis-field">{fieldRows.join('\n')}</pre>
      <p className="vis-float vis-float-bad"><span>{fly.float.badK}</span>{fly.float.bad}</p>
      <p className="vis-float vis-float-good"><span>{fly.float.goodK}</span>{fly.float.good}</p>
    </div>
  )
}

/** Estacion 4: el stack agrupado por funcion. El texto es contenido real (no decorativo). */
export function StackVis() {
  const s = fly.stack
  return (
    <div className="st-vis vis-stack">
      <p className="vis-tag">{fly.tag} · {s.note}</p>
      <dl className="sk-map">
        {s.groups.map(([fn, tech, ctx]) => (
          <div className="sk-row" key={fn}>
            <dt>{fn}</dt>
            <dd>
              {tech.replaceAll(' · ', ' · ')}
              {ctx && <span>{ctx}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

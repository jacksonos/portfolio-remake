import { useState } from 'react'
import { fly } from '../content'

type Verdict = 'pending' | 'accepted' | 'rejected'

function summary(v: Verdict[]): string {
  const a = v.filter((x) => x === 'accepted').length
  const r = v.filter((x) => x === 'rejected').length
  const p = v.length - a - r
  const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`
  if (p === v.length) return `${plural(p, 'cambio')} por revisar`
  const parts = [plural(a, 'aceptado'), plural(r, 'rechazado')]
  if (p > 0) return `${parts.join(', ')}, ${p} por revisar`
  return `${parts.join(', ')}. ${a > 0 ? 'Listo para integrar.' : 'Nada que integrar.'}`
}

/** Mini diff con dos hunks; el estado vive en React. */
export default function Diff({ onFocusIn }: { onFocusIn?: () => void }) {
  const hunks = fly.diff.hunks
  const [state, setState] = useState<Record<string, Verdict>>({})
  const verdicts = hunks.map((h) => state[h.id] ?? 'pending')
  const set = (id: string, v: Verdict) => setState((s) => ({ ...s, [id]: s[id] === v ? 'pending' : v }))

  return (
    <div className="diff" onFocus={onFocusIn}>
      <p className="diff-file">{fly.diff.file}</p>
      {hunks.map((h, i) => {
        const v = verdicts[i]
        return (
          <section key={h.id} className="hunk" data-verdict={v} aria-label={h.title}>
            <header className="hunk-bar">
              <div>
                <p className="hunk-title">{h.title}</p>
                <p className="hunk-head">{h.head}</p>
              </div>
              <div className="hunk-actions">
                <button type="button" aria-pressed={v === 'accepted'} onClick={() => set(h.id, 'accepted')}>
                  Aceptar
                </button>
                <button type="button" aria-pressed={v === 'rejected'} onClick={() => set(h.id, 'rejected')}>
                  Rechazar
                </button>
              </div>
            </header>
            <pre className="hunk-code">
              {h.lines.map(([k, t], j) => (
                <span key={j} className={`dl dl-${k === '+' ? 'add' : k === '-' ? 'del' : 'ctx'}`}>
                  <span className="dl-k" aria-hidden="true">{k}</span>
                  {t}
                  {'\n'}
                </span>
              ))}
            </pre>
          </section>
        )
      })}
      <p className="diff-sum" role="status" aria-live="polite">{summary(verdicts)}</p>
    </div>
  )
}

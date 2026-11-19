import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Sprite, Ty, fillTy, goTo, term, typeOnEnter } from './Pixel'
import { bento, bentoTitle, cta, learningsTitle, manifesto, profile, stack, stages } from './content'
import * as S from './sprites'

export const OPTS = [
  { n: 1, id: 'historia', cmd: 'CALL PGM(CAREER)', label: 'Historia', desc: 'Work with Active Jobs' },
  { n: 2, id: 'hoy', cmd: 'DSPLIBL', label: 'Lo que hago hoy', desc: 'Display Library List' },
  { n: 3, id: 'stack', cmd: 'WRKLIBL', label: 'Stack', desc: 'Edit Library List' },
  { n: 4, id: 'aprendizajes', cmd: 'DSPMSG MSGQ(LEARN)', label: 'Aprendizajes', desc: 'Display Messages' },
  { n: 5, id: 'contacto', cmd: 'SNDMSG TOMSGQ(CONTACT)', label: 'Contacto', desc: 'Send Message' },
  { n: 6, id: 'signoff', cmd: 'SIGNOFF', label: 'Cerrar sesion', desc: 'Sign Off' },
]

const COLORS = ['c-cyan', 'c-yellow', 'c-pink', 'c-blue', 'c-white']

// tecleado escalonado al entrar la seccion en pantalla
function useTypeIn(sel: string, start = 'top 70%') {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const r = root.current!
        typeOnEnter(r, gsap.utils.toArray<HTMLElement>(sel, r), start)
        return () => fillTy(r)
      })
      return () => mm.revert()
    },
    { scope: root },
  )
  return root
}

const Kicker = ({ cmd }: { cmd: string }) => (
  <p className="cmdl">
    <span className="dim">===&gt;</span> <span className="c-white">{cmd}</span>
  </p>
)

/* ---------- 2. MENU ---------- */
export function Menu() {
  const root = useTypeIn('.opt .ty', 'top 65%')
  return (
    <section ref={root} id="menu" className="sec menu" aria-labelledby="h-menu">
      <div className="wrap">
        <h2 id="h-menu" className="scr-title">
          Portfolio Menu
        </h2>
        <p className="dim center">Elige una opcion con el raton, o teclea 1 a 6 en cualquier momento.</p>
        <p className="c-white">Select one of the following:</p>
        <ul className="opts">
          {OPTS.map((o) => (
            <li key={o.n}>
              <button className="opt" onClick={() => goTo(o.id, o.cmd)}>
                <span className="n">{o.n}.</span>
                <span className="o-l">
                  <Ty t={o.label} />
                </span>
                <span className="o-d dim">{o.desc}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="dim">
          Selection or command <span className="c-white">===&gt;</span> <span className="blink-block" aria-hidden="true" />
        </p>
      </div>
    </section>
  )
}

/* ---------- 4. HOY / DSPLIBL ---------- */
export function Today() {
  const root = useTypeIn('.box .ty, .msgq .ty', 'top 60%')
  return (
    <section ref={root} id="hoy" className="sec today" aria-labelledby="h-hoy">
      <div className="wrap">
        <Kicker cmd="DSPLIBL" />
        <h2 id="h-hoy" className="h-big">
          {bentoTitle}
        </h2>
        <div className="bento">
          {bento.map((b, i) => (
            <article key={b.title} className={'box ' + b.span}>
              <span className={'box-lab px ' + COLORS[i % 5]}>LIB0{i + 1}</span>
              <h3>
                <Ty t={b.title} block />
              </h3>
              <p>
                <Ty t={b.text} block />
              </p>
            </article>
          ))}
        </div>
        <p className="msgq">
          <span className="c-cyan">MSGQ . . :</span> <Ty t={manifesto} block />
        </p>
      </div>
    </section>
  )
}

/* ---------- 5. STACK / cinta de library list ---------- */
export function StackTape() {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ motion: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 768px)' }, (ctx) => {
        const c = ctx.conditions as { motion: boolean; desk: boolean }
        if (!c.motion) return
        const r = root.current!
        const rows = gsap.utils.toArray<HTMLElement>('.tape', r)
        const tws = rows.map((row, i) =>
          gsap.fromTo(row, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: 30, ease: 'none', repeat: -1 }),
        )
        const wrap = r.querySelector<HTMLElement>('.tapes')!
        const skew = gsap.quickSetter(wrap, 'skewX', 'deg')
        let cur = 1
        const tick = () => {
          const v = term.lenis?.velocity ?? 0
          cur += (1 + Math.min(Math.abs(v) * 0.5, 9) - cur) * 0.08
          tws.forEach((t) => t.timeScale(cur))
          if (c.desk) skew(gsap.utils.clamp(-10, 10, -v * 0.6))
        }
        gsap.ticker.add(tick)
        return () => {
          gsap.ticker.remove(tick)
          gsap.set(wrap, { skewX: 0 })
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )
  const row = (rev: boolean) => {
    const list = rev ? [...stack].reverse() : stack
    return (
      <div className="tape" aria-hidden={rev ? 'true' : undefined}>
        {[0, 1].map((copy) => (
          <div key={copy} className={'tape-set' + (copy ? ' tape-dup' : '')} aria-hidden={copy ? 'true' : undefined}>
            {list.map((s, i) => (
              <span key={s} className={'tok ' + COLORS[(i + (rev ? 2 : 0)) % 5]}>
                <i>*LIB{stack.indexOf(s) + 1}</i> {s}
              </span>
            ))}
          </div>
        ))}
      </div>
    )
  }
  return (
    <section ref={root} id="stack" className="sec stack" aria-labelledby="h-stack">
      <div className="wrap">
        <Kicker cmd="WRKLIBL" />
        <h2 id="h-stack" className="h-big">
          Mi library list
        </h2>
        <p className="dim">Las herramientas que cargo en mi lista de bibliotecas, de WordPress a LLM.</p>
      </div>
      <div className="tapes">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}

/* ---------- 6. APRENDIZAJES / DSPMSG ---------- */
export function Learnings() {
  const [i, setI] = useState(0)
  const n = stages.length
  const go = (d: number) => setI((v) => (v + d + n) % n)
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'F7') (e.preventDefault(), go(-1))
      else if (e.key === 'F8') (e.preventDefault(), go(1))
    }
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
    // eslint-disable-next-line
  }, [])
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') (e.preventDefault(), go(-1))
    else if (e.key === 'ArrowRight') (e.preventDefault(), go(1))
  }
  return (
    <section id="aprendizajes" className="sec learn" aria-labelledby="h-learn">
      <div className="wrap">
        <Kicker cmd="DSPMSG MSGQ(LEARN)" />
        <h2 id="h-learn" className="h-big">
          {learningsTitle}
        </h2>
        <div className="carousel" role="group" aria-roledescription="carrusel" aria-label="Aprendizajes por etapa" tabIndex={0} onKeyDown={onKey}>
          <div className="msgs">
            {stages.map((s, k) => (
              <article key={s.title} className={'msg' + (k === i ? ' on' : '')} aria-hidden={k !== i}>
                <p className="msg-h dim">
                  Message ID . . . . : <span className="c-white">MSG000{k + 1}</span>
                  <span className="sev"> Severity . . : 00</span>
                </p>
                <p className="msg-h dim">
                  From job . . . . . : <span className="c-cyan">{s.title}</span>
                </p>
                <p className="msg-t">{s.lesson}</p>
                <div className="msg-spr" aria-hidden="true">
                  <Sprite frames={k % 2 ? S.disk : S.robot} scale={4} fps={2} />
                </div>
              </article>
            ))}
          </div>
          <div className="ctrls">
            <button className="fkey" onClick={() => go(-1)}>
              F7=Backward
            </button>
            <span className="dim" aria-live="polite">
              Message {i + 1} of {n}
            </span>
            <button className="fkey" onClick={() => go(1)}>
              F8=Forward
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 7. CONTACTO + SIGN OFF ---------- */
export function Contact() {
  const root = useTypeIn('.cta-t .ty, .cta-p .ty', 'top 65%')
  return (
    <>
      <section ref={root} id="contacto" className="sec contact" aria-labelledby="h-contact">
        <div className="wrap">
          <a className="cta-cmd" href={`mailto:${profile.email}`}>
            <span className="dim">===&gt;</span> <span className="cta-t"><Ty t="SNDMSG TOMSGQ(CONTACT)" /></span>
            <span className="blink-block" aria-hidden="true" />
          </a>
          <h2 id="h-contact" className="h-big">
            {cta.title}
          </h2>
          <p className="cta-p">
            <Ty t={cta.text} block />
          </p>
          <p>
            <span className="dim">To . . . . . . . :</span>{' '}
            <a className="mail" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </p>
        </div>
      </section>

      <section id="signoff" className="sec signoff" aria-labelledby="h-signoff">
        <div className="wrap">
          <h2 id="h-signoff" className="scr-title">
            Sign Off
          </h2>
          <p className="c-white">Specify the following values, then press Enter.</p>
          <dl className="meta">
            <dt>Job log . . . . . :</dt>
            <dd>*NOLIST</dd>
            <dt>Output queue . . :</dt>
            <dd>*CURRENT</dd>
            <dt>Job . . . . . . . :</dt>
            <dd>000125/DEVAI/QPGMR</dd>
          </dl>
          <button className="btn" onClick={() => term.powerCycle()}>
            <span className="rv">F3</span> =Exit (apagar el monitor)
          </button>
          <footer className="foot">
            <nav aria-label="Enlaces">
              <ul>
                {profile.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${profile.email}`}>Email</a>
                </li>
              </ul>
            </nav>
            <p className="dim">{profile.name} - PORTFOL1 - Pantalla decorativa, datos ficticios.</p>
          </footer>
        </div>
      </section>
    </>
  )
}

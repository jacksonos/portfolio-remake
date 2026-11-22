import { useEffect, useRef, useState } from 'react'
import { gsap, SplitText, ScrollTrigger, useGSAP, isTouch, prefersReducedMotion } from '../lib/scroll'
import { chrome, site } from '../content'
import { backToTop } from './backToTop'
import { registerAnchors } from '../mosaic/portraitScroll'

const c = chrome.closing

export default function Closing() {
  const scope = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const emailRef = useRef<HTMLAnchorElement>(null)
  const copyRef = useRef<HTMLButtonElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)
  const [msg, setMsg] = useState('')
  const toastTimer = useRef(0)

  useGSAP(
    () => {
      // El retrato vuelve a formarse (en teselas) mientras el cierre entra: de su borde superior en el borde inferior
      // de la ventana hasta el 35% de alto. Solo se registra el tramo; el estado lo escribe mosaic/portraitScroll.ts.
      const off = registerAnchors('closing', () => {
        const top = scope.current!.getBoundingClientRect().top + window.scrollY
        return [top - window.innerHeight, top - window.innerHeight * 0.35]
      })
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = titleRef.current!
        const split = SplitText.create(el, { type: 'chars,lines', mask: 'lines' })
        gsap.set(split.chars, { yPercent: 105 })
        const tl = gsap.to(split.chars, {
          yPercent: 0,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.05,
          paused: true,
        })
        const st = ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => tl.play() })
        const fade = gsap.from(scope.current!.querySelectorAll('.closing-fade'), {
          opacity: 0,
          y: 16,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 70%', once: true },
        })
        return () => {
          st.kill()
          tl.kill()
          fade.scrollTrigger?.kill()
          fade.kill()
          split.revert()
        }
      })
      return off
    },
    { scope },
  )

  // Efecto magnetico (solo puntero fino y sin movimiento reducido).
  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return
    const cleanups = ([emailRef.current!, copyRef.current!] as HTMLElement[]).map((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        x((e.clientX - (r.left + r.width / 2)) * 0.18)
        y((e.clientY - (r.top + r.height / 2)) * 0.25)
      }
      const leave = () => {
        x(0)
        y(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    })
    return () => cleanups.forEach((f) => f())
  }, [])

  const toast = (text: string) => {
    setMsg('')
    requestAnimationFrame(() => setMsg(text)) // reinicia el live region aunque el texto se repita
    const t = toastRef.current!
    clearTimeout(toastTimer.current)
    gsap.killTweensOf(t)
    if (prefersReducedMotion()) {
      gsap.set(t, { opacity: 1, y: 0 })
    } else {
      gsap.fromTo(t, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' })
    }
    toastTimer.current = window.setTimeout(() => gsap.to(t, { opacity: 0, duration: 0.4 }), 2400)
  }

  const copy = () => {
    const select = () => {
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(emailRef.current!)
      sel?.removeAllRanges()
      sel?.addRange(range)
      toast(c.copyFail)
    }
    // writeText dentro del gesto del clic; si se rechaza, se selecciona el texto.
    if (!navigator.clipboard) return select()
    navigator.clipboard.writeText(site.email).then(() => toast(c.copied), select)
  }

  return (
    <section id="contacto" className="closing" ref={scope} aria-labelledby="closing-title">
      <div className="closing-main">
        <p className="closing-kicker closing-fade">{c.kicker}</p>
        <h2 className="closing-title" id="closing-title" ref={titleRef}>{c.title}</h2>
        <p className="closing-lead closing-fade">{c.lead}</p>
        <div className="closing-mail closing-fade">
          <a className="closing-email" href={`mailto:${site.email}`} ref={emailRef}>{site.email}</a>
          <button type="button" className="closing-copy" ref={copyRef} onClick={copy} data-cursor={c.copy}>
            {c.copy}
          </button>
        </div>
        <span className="sr-only" role="status" aria-live="polite">{msg}</span>
        <div className="closing-toast" ref={toastRef} aria-hidden="true">{msg}</div>
      </div>

      <footer className="closing-foot">
        <p className="closing-copyright">© {new Date().getFullYear()} {site.name}</p>
        <ul className="closing-links">
          {chrome.footer.links.map(([name, key]) => (
            <li key={key}>
              <a href={site.links[key]} target="_blank" rel="noopener noreferrer" onClick={(e) => site.links[key] === '#' && e.preventDefault()}>
                {name}
              </a>
            </li>
          ))}
        </ul>
        <p className="closing-hint" aria-label="Atajos de teclado">
          {chrome.footer.hint.map(([k, t], i) => (
            <span key={k}>
              {i > 0 && <span className="closing-sep" aria-hidden="true"> · </span>}
              <kbd>{k}</kbd> {t}
            </span>
          ))}
        </p>
        <button type="button" className="closing-top" onClick={backToTop}>
          <span>{c.top}</span>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M7 12.5v-11M2.5 6 7 1.5 11.5 6" />
          </svg>
        </button>
      </footer>
    </section>
  )
}

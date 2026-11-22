import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap, getLenis, prefersReducedMotion } from '../lib/scroll'
import { chrome } from '../content'

const m = chrome.modal
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Panel accesible con las equivalencias COBOL -> practica moderna. */
export default function Principios() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const inerted = useRef<Element[]>([])
  const closing = useRef(false)

  useEffect(() => {
    const onOpen = () => {
      if (open || closing.current) return
      opener.current = document.activeElement as HTMLElement | null
      setOpen(true)
    }
    window.addEventListener('open-principios', onOpen)
    return () => window.removeEventListener('open-principios', onOpen)
  }, [open])

  const release = useCallback(() => {
    inerted.current.forEach((n) => n.removeAttribute('inert'))
    inerted.current = []
    delete document.documentElement.dataset.modal
    getLenis()?.start()
    document.documentElement.classList.remove('is-locked')
    setOpen(false)
    closing.current = false
    const o = opener.current
    if (o && document.contains(o)) o.focus({ preventScroll: true })
  }, [])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    if (prefersReducedMotion()) return release()
    const r = root.current!
    gsap
      .timeline({ onComplete: release })
      .to(panel.current, { xPercent: 100, duration: 0.4, ease: 'power3.in' }, 0)
      .to(r.querySelector('.pr-backdrop'), { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0)
  }, [release])

  // Apertura: inert, bloqueo de scroll, foco y entrada.
  useEffect(() => {
    if (!open) return
    const r = root.current!
    inerted.current = Array.from(document.body.children).filter(
      (n) => n !== r && n.tagName !== 'SCRIPT' && !n.hasAttribute('inert'),
    )
    inerted.current.forEach((n) => n.setAttribute('inert', ''))
    document.documentElement.dataset.modal = 'principios'
    document.documentElement.classList.add('is-locked')
    getLenis()?.stop()
    closeBtn.current?.focus({ preventScroll: true })
    if (!prefersReducedMotion()) {
      const rows = r.querySelectorAll('.pr-head > *, .pr-row, .pr-method-title, .pr-method-lead')
      gsap.set(rows, { y: 14, opacity: 0 })
      gsap
        .timeline()
        .fromTo(r.querySelector('.pr-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
        .fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'expo.out' }, 0)
        .to(rows, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, 0.15)
    }
  }, [open])

  // Teclado: ESC y trampa de foco.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(panel.current!.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const cur = document.activeElement
      if (!panel.current!.contains(cur)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && cur === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // Si se desmonta abierto, no dejar la pagina bloqueada.
  useEffect(() => () => {
    inerted.current.forEach((n) => n.removeAttribute('inert'))
    delete document.documentElement.dataset.modal
    document.documentElement.classList.remove('is-locked')
    getLenis()?.start()
  }, [])

  if (!open) return <div ref={root} hidden />
  return createPortal(
    <div className="pr" ref={root}>
      <div className="pr-backdrop" onClick={close} />
      <div className="pr-panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby="pr-title" data-lenis-prevent>
        <div className="pr-head">
          <button type="button" className="pr-close" ref={closeBtn} onClick={close}>
            <span>{m.close}</span>
            <kbd>Esc</kbd>
          </button>
          <h2 id="pr-title" className="pr-title">{m.title}</h2>
          <p className="pr-lead">{m.lead}</p>
        </div>
        <ul className="pr-list">
          {chrome.principios.map(([term, practice, note]) => (
            <li className="pr-row" key={term}>
              <span className="pr-term">{term}</span>
              <div className="pr-body">
                <p className="pr-practice">{practice}</p>
                <p className="pr-note">{note}</p>
              </div>
            </li>
          ))}
        </ul>
        <section className="pr-method" aria-labelledby="pr-method-title">
          <h3 id="pr-method-title" className="pr-method-title">{chrome.method.title}</h3>
          <p className="pr-method-lead">{chrome.method.lead}</p>
          <ul className="pr-list">
            {chrome.method.items.map(([title, text]) => (
              <li className="pr-row" key={title}>
                <span className="pr-term">{title}</span>
                <p className="pr-note pr-note-solo">{text}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="pr-method" aria-labelledby="pr-datos-title">
          <h3 id="pr-datos-title" className="pr-method-title">{chrome.datos.title}</h3>
          <ul className="pr-list">
            {chrome.datos.items.map(([title, text]) => (
              <li className="pr-row" key={title}>
                <span className="pr-term">{title}</span>
                <p className="pr-note pr-note-solo">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>,
    document.body,
  )
}

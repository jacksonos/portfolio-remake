import { useEffect, useRef } from 'react'
import { gsap, isTouch, prefersReducedMotion } from '../lib/scroll'

const INTERACTIVE = 'a, button, [role=button], summary, label[for]'
const FIELD = 'input, textarea, select, [contenteditable=""], [contenteditable=true]'
// Etiquetas por defecto para elementos del hero (sin editar sus archivos).
const LABELS: [string, string][] = [
  ['.hero-pill', 'Explorar'],
  ['.hero-nav a, .hero-nav button', 'Ver'],
]

/** Punto + anillo con retardo suave. Solo puntero fino y sin movimiento reducido. */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const active = typeof window !== 'undefined' && !isTouch() && !prefersReducedMotion()

  useEffect(() => {
    if (!active) return
    const el = root.current!
    const dot = el.querySelector<HTMLElement>('.cursor-dot')!
    const ring = el.querySelector<HTMLElement>('.cursor-ring')!
    const body = el.querySelector<HTMLElement>('.cursor-ring-c')!
    const label = el.querySelector<HTMLElement>('.cursor-label')!
    const html = document.documentElement

    for (const [sel, text] of LABELS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((n) => {
        if (!n.hasAttribute('data-cursor')) n.setAttribute('data-cursor', text)
      })
    }

    const dx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' })
    const dy = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' })
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' })

    let shown = false
    let state = ''
    const setVisible = (v: boolean) => {
      if (v === shown) return
      shown = v
      gsap.to(el, { opacity: v ? 1 : 0, duration: 0.25, overwrite: 'auto' })
    }
    const setNative = (native: boolean) => html.classList.toggle('has-cursor', !native)
    const apply = (t: Element | null) => {
      const marked = t?.closest<HTMLElement>('[data-cursor]')
      const text = marked?.getAttribute('data-cursor') ?? ''
      const next = t?.closest(FIELD) ? 'field' : marked || t?.closest(INTERACTIVE) ? 'link' : 'idle'
      const key = next + '|' + text
      if (key === state) return
      state = key
      setNative(next === 'field')
      setVisible(next !== 'field')
      label.textContent = text
      gsap.to(body, { scale: next === 'link' ? (text ? 2.4 : 1.5) : 1, duration: 0.4, ease: 'expo.out', overwrite: 'auto' })
      body.classList.toggle('is-filled', !!text)
      el.classList.toggle('is-label', !!text)
      gsap.to(dot, { opacity: text ? 0 : 1, duration: 0.2, overwrite: 'auto' })
      gsap.to(label, { opacity: text ? 1 : 0, duration: 0.25, overwrite: 'auto' })
    }

    let lx = -1
    let ly = -1
    let raf = 0
    // El scroll cambia lo que hay bajo el puntero sin eventos de puntero: reevaluar.
    const rescan = () => {
      raf = 0
      if (lx >= 0) apply(document.elementFromPoint(lx, ly))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(rescan)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      lx = e.clientX
      ly = e.clientY
      if (!shown) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      apply(e.target as Element)
      if (state.startsWith('field')) return
      setNative(false)
      setVisible(true)
    }
    const down = () => gsap.to(body, { scale: '*=0.8', duration: 0.15, overwrite: 'auto' })
    const up = () => {
      state = ''
      gsap.to(body, { scale: 1, duration: 0.3, overwrite: 'auto' })
    }
    const leave = () => {
      setVisible(false)
      setNative(true)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('mouseleave', leave)
    window.addEventListener('blur', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
      window.removeEventListener('blur', leave)
      html.classList.remove('has-cursor')
    }
  }, [active])

  if (!active) return null
  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <div className="cursor-dot" />
      <div className="cursor-ring">
        <span className="cursor-ring-c" />
        <span className="cursor-label" />
      </div>
    </div>
  )
}

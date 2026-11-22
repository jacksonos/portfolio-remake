import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import { restoreTarget, trackScroll } from './restore'
import { isWiping, wipe } from './wipe'
import { mosaic } from '../mosaic/api'

// Plugins registrados una sola vez; el resto de modulos importan desde aqui.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin)
export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP }

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches

let lenisInstance: Lenis | null = null
/** Instancia de Lenis (null con movimiento reducido o en tactil). */
export const getLenis = () => lenisInstance

/** Distancia (en alturas de ventana) a partir de la cual el salto usa la transicion de teselas en vez del scroll suave. */
export const LONG_JUMP = 3

const resolveEl = (target: string | number | HTMLElement) =>
  typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target instanceof HTMLElement ? target : null

/** Salto largo: teselas cubren, el scroll salta instantaneo con todo cubierto, teselas destapan. Un solo salto a la vez. */
function wipeJump(y: number, target: string | number | HTMLElement) {
  if (isWiping()) return
  const prev = document.activeElement as HTMLElement | null
  const inerted = Array.from(document.body.children).filter((n) => n.tagName !== 'SCRIPT' && !n.classList.contains('wipe') && !n.hasAttribute('inert'))
  const block = (e: Event) => e.preventDefault()
  const keys = (e: KeyboardEvent) => {
    if ([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault()
  }
  inerted.forEach((n) => n.setAttribute('inert', ''))
  getLenis()?.stop()
  window.addEventListener('wheel', block, { passive: false })
  window.addEventListener('touchmove', block, { passive: false })
  window.addEventListener('keydown', keys, true)
  const top = y <= 2
  const done = () => {
    window.removeEventListener('wheel', block)
    window.removeEventListener('touchmove', block)
    window.removeEventListener('keydown', keys, true)
    inerted.forEach((n) => n.removeAttribute('inert'))
    getLenis()?.start()
    const el = top ? document.getElementById('main') : typeof target === 'string' ? resolveEl(target) : null
    const f = el ?? (prev && document.contains(prev) ? prev : null)
    if (el && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    f?.focus({ preventScroll: true })
  }
  void wipe(
    () => {
      const l = getLenis()
      if (l) l.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior })
      ScrollTrigger.update()
    },
    // al llegar arriba la cara verde vuelve a formarse (entrada de la primera carga); en #contacto ya esta formada por scroll
    () => top && mosaic.reform(),
  ).finally(done)
}

/** scrollTo que funciona con y sin Lenis. Saltos largos (> LONG_JUMP alturas de ventana) usan la transicion de teselas. */
export function scrollToTarget(target: string | number | HTMLElement, opts: { offset?: number; immediate?: boolean; duration?: number } = {}) {
  if (isWiping()) return
  const el = resolveEl(target)
  const y = (typeof target === 'number' ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0) + (opts.offset ?? 0)
  if (!opts.immediate && !prefersReducedMotion() && Math.abs(y - window.scrollY) > LONG_JUMP * window.innerHeight) return wipeJump(Math.max(0, Math.round(y)), target)
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts })
    return
  }
  window.scrollTo({ top: y, behavior: opts.immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

let started = false
export function initScroll() {
  if (started) return
  started = true
  if (prefersReducedMotion() || isTouch()) return
  const l = new Lenis({ lerp: 0.1, smoothWheel: true })
  lenisInstance = l
  l.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => l.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

/** Tras fuentes + layout: ancla de la URL o scroll guardado; despues empieza a guardar. */
export function initRestore() {
  try {
    history.scrollRestoration = 'manual'
  } catch {
    /* ignorar */
  }
  const settle = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }))
  void Promise.all([document.fonts?.ready ?? Promise.resolve(), loaded]).then(async () => {
    await settle()
    ScrollTrigger.refresh()
    const t = restoreTarget()
    let y = 0
    if (t && 'y' in t) y = t.y
    else if (t && t.hash !== '#hero') {
      // posicion en el documento medida con scroll 0 (nada fijado aun)
      window.scrollTo(0, 0)
      ScrollTrigger.refresh()
      y = Math.round(document.querySelector<HTMLElement>(t.hash)!.getBoundingClientRect().top)
    }
    const go = () => {
      if (!t) return
      scrollToTarget(y, { immediate: true })
      ScrollTrigger.update()
    }
    go()
    if (t) {
      // el layout puede moverse una vez (fuentes tardias): una sola re-aplicacion si el usuario no se ha movido
      const landed = window.scrollY
      await new Promise((r) => setTimeout(r, 350))
      ScrollTrigger.refresh()
      if (Math.abs(window.scrollY - landed) < 4) go()
    }
    trackScroll()
  })
}

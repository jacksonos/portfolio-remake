import { useEffect, useRef, useState } from 'react'
import { gsap, SplitText, useGSAP, scrollToTarget } from '../lib/scroll'
import { mosaic } from '../mosaic/api'
import { hero, site } from '../content'

const initials = site.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2)

function localTime(): string {
  try {
    return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: site.tz }).format(new Date())
  } catch {
    return ''
  }
}

const go = (sel: string) => (e: React.MouseEvent) => {
  e.preventDefault()
  scrollToTarget(sel)
}

/** Banda superior: marca, microetiquetas y navegacion. Landmark banner. */
export function HeroHeader() {
  const [time, setTime] = useState(localTime)
  useEffect(() => {
    let t = 0
    const tick = () => {
      setTime(localTime())
      t = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
    }
    t = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <header className="hero-top">
      <a className="hero-mark" href="#hero" aria-label={`${site.name}, inicio`} onClick={go('#hero')}>
        {initials}
      </a>
      <div className="hero-label">
        <span className="hero-label-k">{hero.labels.now}</span>
        <span className="hero-label-v">{site.role}</span>
        <span className="hero-label-sub">{hero.nowSub}</span>
      </div>
      <div className="hero-label">
        <span className="hero-label-k">{hero.labels.based}</span>
        <span className="hero-label-v">
          {site.city}
          {time && <> (<time className="hero-time">{time}</time>)</>}
        </span>
      </div>
      <nav className="hero-label" aria-label="Principal">
        <span className="hero-label-k">{hero.labels.nav}</span>
        <ul className="hero-nav">
          <li><a href="#recorrido" onClick={go('#recorrido')}>{hero.nav[0]}</a></li>
          <li>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-principios'))}>{hero.nav[1]}</button>
          </li>
          <li><a href="#contacto" onClick={go('#contacto')}>{hero.nav[2]}</a></li>
        </ul>
      </nav>
    </header>
  )
}

export default function Hero() {
  const scope = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useGSAP(
    () => {
      const el = nameRef.current!
      const path = pathRef.current!
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(el, { type: 'words,chars' })
        gsap.set(split.chars, { yPercent: 55, opacity: 0 })
        gsap.set(path, { drawSVG: '0%' })
        el.classList.remove('is-pending')
        let played = false
        const play = () => {
          if (played) return
          played = true
          gsap.to(split.chars, { yPercent: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.045 })
          gsap.to(path, { drawSVG: '100%', duration: 2.2, ease: 'power2.inOut', delay: 0.6 })
        }
        const off = mosaic.onFormed(play)
        const fallback = gsap.delayedCall(4, play) // si el lienzo no llegara a formar
        return () => {
          off()
          fallback.kill()
          split.revert()
        }
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        el.classList.remove('is-pending')
      })
    },
    { scope },
  )

  return (
    <section id="hero" className="hero" ref={scope}>
      <svg className="hero-scribble" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path
          ref={pathRef}
          d="M270 530 C410 470 520 570 640 475 S790 285 905 335 C1015 385 1005 250 895 215 C790 185 760 335 885 400 S1135 335 1255 150"
        />
      </svg>

      <div className="hero-foot">
        <p className="hero-blurb"><span>{hero.blurb}</span></p>
        <button type="button" className="hero-pill" onClick={() => scrollToTarget('#recorrido')}>
          <span>{hero.cta}</span>
          <span className="hero-pill-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 1.5v11M2.5 8 7 12.5 11.5 8" />
            </svg>
          </span>
        </button>
      </div>

      <h1 className="hero-name is-pending" ref={nameRef}>{site.name}</h1>
    </section>
  )
}

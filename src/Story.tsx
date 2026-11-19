import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { manifesto, stages, pic } from './content'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const words = manifesto.split(' ')

export default function Story() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Manifiesto: palabras 0.1 -> 1 con scrub
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.word',
          { opacity: 0.1 },
          {
            opacity: 1, ease: 'none', stagger: 0.5,
            scrollTrigger: { trigger: '.manifesto', start: 'top 80%', end: 'bottom 50%', scrub: true },
          },
        )
      })

      // Carrera: columna izquierda fija (solo md+ y con movimiento permitido)
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const titles = gsap.utils.toArray<HTMLElement>('.stage-title')
        const fills = gsap.utils.toArray<HTMLElement>('.rail-fill')
        const show = (i: number, d = 0.6) => {
          titles.forEach((t, k) =>
            gsap.to(t, { opacity: k === i ? 1 : 0, y: k === i ? 0 : k < i ? -28 : 28, duration: d, overwrite: true }),
          )
          fills.forEach((f, k) => gsap.to(f, { scaleX: k <= i ? 1 : 0, duration: d, overwrite: true }))
          gsap.to('.hue', { backgroundColor: stages[i].hue, duration: 1.2, overwrite: true })
        }
        show(0, 0)

        ScrollTrigger.create({
          trigger: '.pin-wrap', start: 'top top', end: 'bottom bottom',
          pin: '.pin-left', pinSpacing: false,
        })
        gsap.utils.toArray<HTMLElement>('.chapter').forEach((el, i) =>
          ScrollTrigger.create({
            trigger: el, start: 'top 55%', end: 'bottom 55%',
            onToggle: (self) => self.isActive && show(i),
          }),
        )
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="historia" ref={root} aria-label="Mi historia" className="relative">
      {/* Manifiesto */}
      <div className="relative py-32 md:py-48 px-6">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <p className="manifesto relative mx-auto max-w-5xl text-3xl md:text-5xl font-medium leading-tight tracking-tight">
          {words.map((w, i) => (
            <span key={i} className="word inline-block mr-[0.25em]">{w}</span>
          ))}
        </p>
      </div>

      {/* Carrera */}
      <div className="pin-wrap md:motion-safe:flex">
        <div className="pin-left relative hidden md:motion-safe:flex h-screen w-1/2 shrink-0 flex-col justify-center overflow-hidden px-12">
          <div aria-hidden className="hue absolute inset-0 -z-0 opacity-70 transition-none" style={{ backgroundColor: stages[0].hue }} />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,165,36,0.18),transparent_60%)]" />
          <div className="relative grid">
            {stages.map((s, i) => (
              <h2
                key={s.title}
                className={`stage-title col-start-1 row-start-1 text-6xl font-semibold leading-[1.05] tracking-tight ${i ? 'opacity-0' : ''}`}
              >
                {s.title}
              </h2>
            ))}
          </div>
          <div aria-hidden className="relative mt-16 grid grid-cols-5 gap-2">
            {stages.map((s) => (
              <div key={s.title} className="h-1 overflow-hidden rounded-full bg-white/15">
                <div className="rail-fill h-full origin-left scale-x-0 bg-accent" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:motion-safe:w-1/2">
          {stages.map((s) => (
            <article
              key={s.title}
              className="chapter flex flex-col justify-center gap-8 px-6 py-16 md:px-12 md:motion-safe:min-h-screen md:motion-safe:py-24"
            >
              <h2 className="text-4xl font-semibold leading-tight tracking-tight md:motion-safe:hidden">{s.title}</h2>
              <div className="group aspect-video overflow-hidden rounded-3xl">
                <img
                  src={pic(s.seed)} alt={`Ilustración de la etapa: ${s.title}`} loading="lazy"
                  className="h-full w-full object-cover grayscale contrast-125 opacity-90 mix-blend-luminosity transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <p className="text-xl text-white/80 md:text-2xl">{s.text}</p>
              <ul className="space-y-3 text-lg text-white/60">
                {s.points.map((p) => (
                  <li key={p} className="border-l-2 border-accent pl-4">{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

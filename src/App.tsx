import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import Story from './Story'
import { bento, bentoTitle, cta, hero, learningsTitle, nav, pic, profile, stack, stages } from './content'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const shade = 'bg-gradient-to-t from-ink via-ink/60 to-transparent'

function Blob({ className }: { className: string }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`} />
}

function Nav() {
  return (
    <header className="fixed left-1/2 top-4 z-40 -translate-x-1/2">
      <nav aria-label="Principal" className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-2 text-sm backdrop-blur-xl">
        {nav.map((n) => (
          <a key={n.href} href={n.href} className={`rounded-full px-3 py-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:px-4 ${n.mobile ? '' : 'hidden sm:block'} ${focus}`}>
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden py-32 md:py-48">
      <Blob className="-left-32 top-0 h-[30rem] w-[30rem] bg-accent/20" />
      <Blob className="bottom-0 right-0 h-[26rem] w-[26rem] bg-indigo-500/20" />
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <h1 className="hero-in font-semibold leading-[1.02] tracking-tight md:ml-16" style={{ fontSize: 'clamp(3rem,5vw,5.5rem)' }}>
          <span className="block">
            {hero.lineA}
            <span
              role="img" aria-label="Detalle de circuito"
              className="mx-2 inline-block h-10 w-24 rounded-full bg-cover bg-center align-middle grayscale contrast-125"
              style={{ backgroundImage: `url(${pic(hero.pillSeed)})` }}
            />
          </span>
          <span className="block">{hero.lineB}</span>
        </h1>
        <p className="hero-in relative z-10 mt-8 max-w-xl text-lg text-white/70 md:ml-16 md:text-xl">{hero.sub}</p>
        <div className="hero-in relative z-10 mt-10 flex flex-wrap gap-4 md:ml-16">
          <a href={hero.cta1.href} className={`rounded-full border border-white/25 bg-neutral-950 px-8 py-4 font-medium text-white transition-colors hover:bg-neutral-900 ${focus}`}>
            {hero.cta1.label}
          </a>
          <a href={hero.cta2.href} className={`rounded-full bg-white px-8 py-4 font-medium text-neutral-950 transition-colors hover:bg-white/85 ${focus}`}>
            {hero.cta2.label}
          </a>
        </div>
      </div>
      <img
        src={pic(hero.floatSeed)} alt="Escritorio de trabajo con código en pantalla" loading="eager"
        className="hero-float pointer-events-none absolute -bottom-6 right-0 z-0 h-64 w-48 -rotate-6 rounded-[2rem] object-cover opacity-60 mix-blend-luminosity grayscale contrast-125 md:bottom-16 md:right-[6%] md:h-[28rem] md:w-80 md:opacity-90"
      />
    </section>
  )
}

function Bento() {
  return (
    <section id="hoy" aria-labelledby="hoy-t" className="relative px-6 py-32 md:py-48">
      <Blob className="left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 bg-accent/10" />
      <div className="relative mx-auto max-w-6xl">
        <h2 id="hoy-t" className="mb-12 text-4xl font-semibold tracking-tight md:text-6xl">{bentoTitle}</h2>
        <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[15rem]">
          {bento.map((b) => (
            <article key={b.title} className={`reveal group relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 ${b.span}`}>
              <img
                src={pic(b.seed)} alt={`Imagen de ${b.title}`} loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-luminosity grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className={`absolute inset-0 ${shade}`} />
              <div className="relative flex h-full flex-col justify-end p-6">
                <h3 className="text-2xl font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-2 max-w-md text-white/75">{b.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Marquee() {
  const row = (dup: boolean) =>
    stack.map(({ label, icon: I }) => (
      <span key={label + dup} aria-hidden={dup || undefined} className={`flex items-center gap-4 pr-16 text-5xl font-semibold tracking-tight text-white/85 md:text-7xl ${dup ? 'marquee-dup' : ''}`}>
        <I size={56} weight="duotone" className="shrink-0 text-accent" />
        {label}
      </span>
    ))
  return (
    <section id="stack" aria-label="Stack tecnológico" className="relative overflow-hidden py-32 md:py-48">
      <div className="marquee-track flex">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}

function Learnings() {
  const [i, setI] = useState(0)
  const n = stages.length
  const go = (d: number) => setI((i + d + n) % n)
  const arrow = `grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white ${focus}`
  return (
    <section id="aprendizajes" aria-labelledby="ap-t" className="relative px-6 py-32 md:py-48">
      <Blob className="right-0 top-1/4 h-96 w-96 bg-indigo-500/15" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 id="ap-t" className="text-4xl font-semibold tracking-tight md:text-6xl">{learningsTitle}</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} aria-label="Anterior" className={arrow}><ArrowLeft size={20} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente" className={arrow}><ArrowRight size={20} /></button>
          </div>
        </div>
        <div className="overflow-hidden py-6">
          <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
            {stages.map((s, k) => (
              <figure key={s.title} aria-hidden={k !== i} className="grid w-full shrink-0 items-center gap-6 md:grid-cols-5 md:gap-0">
                <img
                  src={pic(s.seed + 'x')} alt={`Imagen de la etapa ${s.title}`} loading="lazy"
                  className="relative z-10 aspect-[4/3] w-full rounded-3xl object-cover opacity-90 mix-blend-luminosity grayscale contrast-125 md:col-span-2 md:-mr-12 md:aspect-[4/5]"
                />
                <blockquote className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:col-span-3 md:py-20 md:pl-24 md:pr-12">
                  <p className="text-2xl font-light leading-snug tracking-tight md:text-4xl">“{s.lesson}”</p>
                  <figcaption className="mt-8 text-accent">{s.title}</figcaption>
                </blockquote>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="contacto" className="relative overflow-hidden px-6 pt-32 md:pt-48">
      <Blob className="left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 bg-accent/20" />
      <div className="relative mx-auto max-w-6xl">
        <h2 className="font-semibold leading-none tracking-tighter" style={{ fontSize: 'clamp(3.5rem,13vw,12rem)' }}>{cta.title}</h2>
        <p className="mt-6 max-w-xl text-lg text-white/70 md:text-xl">{cta.text}</p>
        <a
          href={`mailto:${profile.email}`}
          className={`mt-10 inline-flex items-center gap-4 rounded-full bg-accent px-8 py-5 text-xl font-semibold text-neutral-950 transition-transform hover:scale-[1.03] md:px-12 md:py-7 md:text-3xl ${focus}`}
        >
          {profile.email}
          <ArrowUpRight size={32} weight="bold" />
        </a>
        <div className="mt-32 flex flex-col justify-between gap-6 border-t border-white/10 py-8 text-white/60 md:flex-row">
          <p>{profile.name}</p>
          <ul className="flex gap-6">
            {profile.links.map((l) => (
              <li key={l.label}><a href={l.href} className={`rounded transition-colors hover:text-white ${focus}`}>{l.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-in', { opacity: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.12 })
        gsap.to('.hero-float', { y: -18, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) =>
          gsap.from(el, { opacity: 0, y: 48, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }),
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <main ref={root} className="overflow-x-hidden w-full max-w-full">
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.07] mix-blend-overlay" />
      <Nav />
        <Hero />
        <Bento />
        <Story />
        <Marquee />
        <Learnings />
        <Footer />
    </main>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Parallax, goTo, term } from './Pixel'
import Boot from './Boot'
import Career from './Career'
import { Contact, Learnings, Menu, OPTS, StackTape, Today } from './Sections'

gsap.registerPlugin(ScrollTrigger)

const SECS = ['inicio', 'menu', 'historia', 'hoy', 'stack', 'aprendizajes', 'contacto', 'signoff']
const TITLES = [
  'Sign On',
  'Portfolio Menu',
  'Work with Active Jobs',
  'Display Library List',
  'Edit Library List',
  'Display Messages',
  'Send Message',
  'Sign Off',
]
const SCREEN_ID = ['QSNSIGN', 'PORTMENU', 'WRKACTJOB', 'DSPLIBL', 'WRKLIBL', 'DSPMSG', 'SNDMSG', 'SIGNOFF']
const PHOS = ['green', 'amber', 'white'] as const
const pad = (n: number) => String(n).padStart(2, '0')
const stamp = () => {
  const d = new Date()
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${pad(d.getFullYear() % 100)}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function cyclePhos() {
  const el = document.documentElement
  const next = PHOS[(PHOS.indexOf((el.dataset.phos ?? 'green') as (typeof PHOS)[number]) + 1) % PHOS.length]
  el.dataset.phos = next
  try {
    localStorage.setItem('phos', next)
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new Event('phos'))
}

function Chrome() {
  const [sec, setSec] = useState(0)
  const [cmd, setCmd] = useState('')
  const [msg, setMsg] = useState('')
  const [now, setNow] = useState(stamp)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    term.setSec = setSec
    term.setCmd = setCmd
    const t = setInterval(() => setNow(stamp()), 1000)
    return () => clearInterval(t)
  }, [])

  const run = (raw: string) => {
    const c = raw.trim().toUpperCase()
    setMsg('')
    if (!c) return
    const o = OPTS.find((x) => String(x.n) === c || x.cmd === c || x.id.toUpperCase() === c)
    setCmd('')
    if (o) return goTo(o.id)
    if (c === 'MENU' || c === 'GO MAIN') return goTo('menu')
    if (c === 'TOP' || c === 'SIGNON') return goTo('top')
    if (c === 'WRKACTJOB') return goTo('historia')
    setMsg(`CPD0006  Command ${c} not valid. Try 1-6 or MENU.`)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
      if (e.key === 'F9') (e.preventDefault(), cyclePhos())
      else if (e.key === 'F3') (e.preventDefault(), goTo('signoff', 'SIGNOFF'))
      else if (e.key === 'F12') (e.preventDefault(), setCmd(''), setMsg(''))
      else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && /^[1-6]$/.test(e.key)) run(e.key)
    }
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(cmd)
  }
  const pos = `${pad(sec + 1)}/${String(SECS.length).padStart(3, '0')}`

  return (
    <>
      <header className="chrome-top">
        <div className="ct-row">
          <span className="dim hide-sm">{SCREEN_ID[sec]}</span>
          <span className="ct-title c-white">{TITLES[sec]}</span>
          <span className="ct-sys">PORTFOL1</span>
        </div>
        <div className="ct-row ct-sub dim">
          <span>User . : GUEST</span>
          <span aria-hidden="true">{now}</span>
        </div>
      </header>
      <div className="chrome-bot">
        <p className="msgline c-red" role="status">
          {msg}
        </p>
        <form className="cmdrow" onSubmit={submit}>
          <label htmlFor="cmd" className="c-white">
            Command ===&gt;
          </label>
          <input
            id="cmd"
            ref={input}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onFocus={(e) => e.target.select()}
            autoComplete="off"
            spellCheck={false}
            maxLength={40}
            aria-describedby="cmd-help"
          />
          <span id="cmd-help" className="sr-only">
            Escribe un numero del 1 al 6 y pulsa Enter para ir a una seccion.
          </span>
        </form>
        <div className="fkeys" role="toolbar" aria-label="Teclas de funcion">
          <button className="fkey" onClick={() => goTo('signoff', 'SIGNOFF')}>
            F3=Exit
          </button>
          <button className="fkey hide-sm" onClick={() => goTo('top', 'TOP')}>
            F5=Refresh
          </button>
          <button className="fkey" onClick={cyclePhos}>
            F9=Color
          </button>
          <button
            className="fkey hide-sm"
            onClick={() => {
              setCmd('')
              setMsg('')
              input.current?.focus()
            }}
          >
            F12=Cancel
          </button>
          <span className="stat" aria-hidden="true">
            MA &nbsp;a &nbsp;{pos}
          </span>
        </div>
      </div>
    </>
  )
}

export default function App() {
  // Lenis + GSAP, solo con movimiento permitido
  useEffect(() => {
    try {
      const s = localStorage.getItem('phos')
      if (s && PHOS.includes(s as (typeof PHOS)[number])) document.documentElement.dataset.phos = s
    } catch {
      /* sin almacenamiento */
    }
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
      term.lenis = lenis
      lenis.on('scroll', ScrollTrigger.update)
      const tick = (t: number) => lenis.raf(t * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      return () => {
        gsap.ticker.remove(tick)
        gsap.ticker.lagSmoothing(500, 33)
        lenis.destroy()
        term.lenis = null
      }
    })

    // seccion actual para la cabecera y el indicador de estado
    const trig = SECS.map((id, i) =>
      ScrollTrigger.create({
        trigger: '#' + id,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && term.setSec(i),
      }),
    )

    // anclas con scroll suave
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
      if (!a) return
      e.preventDefault()
      const id = a.getAttribute('href')!.slice(1)
      if (id) goTo(id)
    }
    document.addEventListener('click', click)
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    addEventListener('load', refresh)

    return () => {
      document.removeEventListener('click', click)
      removeEventListener('load', refresh)
      trig.forEach((t) => t.kill())
      mm.revert()
    }
  }, [])

  return (
    <>
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <Parallax />
      <Chrome />
      <main id="main">
        <Boot />
        <Menu />
        <Career />
        <Today />
        <StackTape />
        <Learnings />
        <Contact />
      </main>
      <div className="po" aria-hidden="true">
        <div className="po-t" />
        <div className="po-b" />
        <div className="po-beam" />
      </div>
      <div className="bezel" aria-hidden="true" />
      <div className="crt" aria-hidden="true" />
    </>
  )
}

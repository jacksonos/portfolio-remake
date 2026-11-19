import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Sprite, Ty, fillTy, goTo, term, typeOnEnter, typeTo } from './Pixel'
import { hero, profile } from './content'
import * as S from './sprites'

const POST = [
  'IBM i  Licensed Internal Code  -  PORTFOL1  V7R4M0',
  'IPL type . . . . . . . . . . :  *NORMAL',
  'Main storage . . . . . . . . :  0512 MB   [ OK ]',
  'Auxiliary storage  . . . . . :  CHECKING  [ OK ]',
  'Starting subsystems  QCTL  QINTER  QBATCH  QUSRWRK',
  'Storage management recovery . :  COMPLETE',
  'IPL complete.  System PORTFOL1 ready for sign on.',
]

export default function Boot() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const r = root.current!
      const q = <T extends Element = HTMLElement>(s: string) => r.querySelector<T>(s)!
      const mm = gsap.matchMedia()

      // encendido / apagado CRT (compartido con F3)
      const po = document.querySelector<HTMLElement>('.po')!
      const halves = Array.from(po.querySelectorAll('.po-t,.po-b'))
      const beam = po.querySelector('.po-beam')!
      const on = () =>
        gsap
          .timeline()
          .set(po, { autoAlpha: 1 })
          .set(halves, { scaleY: 1 })
          .set(beam, { scaleX: 0, scaleY: 1, opacity: 1 })
          .to(beam, { scaleX: 1, duration: 0.35, ease: 'power2.out' })
          .to(beam, { scaleY: 7, duration: 0.15, ease: 'steps(3)' })
          .to(halves, { scaleY: 0, duration: 0.6, ease: 'power3.in' }, '-=0.05')
          .to(beam, { opacity: 0, duration: 0.25 }, '-=0.35')
          .set(po, { autoAlpha: 0 })
      const off = () =>
        gsap
          .timeline()
          .set(po, { autoAlpha: 1 })
          .set(beam, { scaleX: 1, scaleY: 1, opacity: 0 })
          .set(halves, { scaleY: 0 })
          .to(halves, { scaleY: 1, duration: 0.45, ease: 'power3.in' })
          .set(beam, { opacity: 1 }, '-=0.05')
          .to(beam, { scaleX: 0, duration: 0.3, ease: 'power2.in' }, '+=0.12')
          .to(beam, { opacity: 0, duration: 0.05 })

      mm.add(
        {
          full: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          lite: '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const full = (ctx.conditions as { full: boolean }).full
          const lines = gsap.utils.toArray<HTMLElement>('.post-l .ty', r)
          const user = q('.f-user .ty')
          const pw = q('.f-pw .ty')

          // 1) encendido y POST por tiempo
          const intro = gsap.timeline({ delay: 0.2 })
          intro.add(on())
          gsap.set('.hint', { autoAlpha: 0 })
          lines.forEach((l) => typeTo(intro, l, '>+0.05', Math.max(0.2, (l.dataset.t ?? '').length * 0.012)))
          intro.to('.hint', { autoAlpha: 1, duration: 0.01 })
          term.powerCycle = () => {
            const t = gsap.timeline()
            t.add(off())
            t.call(() => {
              term.lenis?.scrollTo(0, { immediate: true, force: true })
              window.scrollTo(0, 0)
            })
            t.add(on(), '+=0.35')
          }

          // 2) Sign On
          const els = [q('.so-ok-t')]
          if (full) {
            r.querySelector('.boot-pin')!.classList.add('is-pinned')
            const st = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: { trigger: '.boot-pin', start: 'top top', end: '+=240%', pin: true, scrub: 0.5, anticipatePin: 1 },
            })
            gsap.set('.signon', { autoAlpha: 0 })
            gsap.set('.so-after,.so-ok', { autoAlpha: 0 })
            st.to('.post', { autoAlpha: 0, y: -24, duration: 0.14, ease: 'steps(4)' }, 0.02)
              .fromTo('.signon', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'steps(4)' }, 0.1)
            typeTo(st, user, 0.28, 0.17)
            typeTo(st, pw, 0.48, 0.17)
            st.to('.so-after,.so-ok', { autoAlpha: 1, duration: 0.02 }, 0.68)
              .fromTo('.so-tower', { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'steps(5)' }, 0.72)
            typeTo(st, els[0], 0.8, 0.16)
            st.to({}, { duration: 0.04 }, 0.96)
            return () => {
              r.querySelector('.boot-pin')?.classList.remove('is-pinned')
              fillTy(r)
            }
          }
          // lite: sin pin, se teclea al entrar
          typeOnEnter(q('.signon'), [user, pw, els[0]], 'top 70%')
          return () => fillTy(r)
        },
      )
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="inicio" className="sec boot" aria-label="Inicio de sesion">
      <div className="boot-pin">
        <div className="post" aria-label="Arranque del sistema">
          <div className="post-l">
            {POST.map((l) => (
              <div key={l}>
                <Ty t={l} />
              </div>
            ))}
          </div>
          <p className="hint dim">
            <span className="blink">_</span> Desplaza para iniciar sesion
          </p>
        </div>

        <div className="signon">
          <h2 className="scr-title">Sign On</h2>
          <div className="so-grid">
            <div>
              <dl className="meta">
                <dt>System . . . . :</dt>
                <dd>PORTFOL1</dd>
                <dt>Subsystem  . . :</dt>
                <dd>QINTER</dd>
                <dt>Display  . . . :</dt>
                <dd>QPADEV0001</dd>
              </dl>
              <div className="field-row">
                <span className="lab">User . . . . . . . . . .</span>
                <span className="fld f-user">
                  <Ty t="VISITANTE" className="c-white" />
                  <span className="blink-block" aria-hidden="true" />
                </span>
              </div>
              <div className="field-row">
                <span className="lab">Password . . . . . . . .</span>
                <span className="fld f-pw">
                  <Ty t="********" />
                </span>
              </div>
              <div className="field-row">
                <span className="lab">Menu  . . . . . . . . .</span>
                <span className="fld c-cyan">PORTMENU</span>
              </div>
              <div className="so-after">
                <p className="c-yellow">Sign on accepted. Welcome, {profile.name}.</p>
              </div>
            </div>
            <div className="so-tower" aria-hidden="true">
              <Sprite frames={S.tower} scale={9} fps={2} />
              <span className="px dim">AS/400  PORTFOL1</span>
            </div>
          </div>
          <div className="so-ok">
            <h1 className="so-h1">
              {hero.lineA} {hero.lineB}
            </h1>
            <p className="so-p">
              <Ty t={hero.sub} className="so-ok-t" block />
            </p>
            <p className="so-cta">
              <button className="btn" onClick={() => goTo('menu', 'GO MENU')}>
                <span className="rv">Enter</span> Ir al menu principal
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

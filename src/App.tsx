import { useEffect } from 'react'
import { initRestore } from './lib/scroll'
import Mosaic from './mosaic/Mosaic'
import Hero, { HeroHeader } from './hero/Hero'
import Fly from './fly/Fly'
import Closing from './chrome/Closing'
import Chrome from './chrome/Chrome'

export default function App() {
  useEffect(() => initRestore(), [])
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          const m = document.getElementById('main')!
          m.focus({ preventScroll: true })
          m.scrollIntoView({ block: 'start' })
        }}
      >Saltar al contenido</a>
      <Mosaic />
      <HeroHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Fly />
        <Closing />
      </main>
      <Chrome />
    </>
  )
}

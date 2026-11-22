import { useEffect } from 'react'
import { scrollToTarget } from '../lib/scroll'
import Cursor from './Cursor'
import Principios from './Principios'
import { backToTop } from './backToTop'

/** Monta cursor, modal de Principios y atajos globales. */
export default function Chrome() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (document.documentElement.dataset.modal) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const k = e.key.toLowerCase()
      if (k === 'p') window.dispatchEvent(new CustomEvent('open-principios'))
      else if (k === 'c') scrollToTarget('#contacto')
      else if (k === 't') backToTop()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Cursor />
      <Principios />
    </>
  )
}

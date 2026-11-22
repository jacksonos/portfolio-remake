// Restauracion de scroll al recargar y anclas en la URL. Sin dependencias: lo lee tambien el motor del mosaico.
const KEY = 'cm-scroll-y'
const HASHES: Record<string, string> = { '#recorrido': '#recorrido', '#contacto': '#contacto', '#hero': '#hero' }

export type RestoreTarget = { hash: string } | { y: number } | null

function navType(): string {
  try {
    return (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'navigate'
  } catch {
    return 'navigate'
  }
}

/** Destino inicial: ancla valida de la URL; si no, ultimo scrollY guardado (solo recarga o atras/adelante). */
export function restoreTarget(): RestoreTarget {
  const nt = navType()
  let y = 0
  try {
    y = Number(sessionStorage.getItem(KEY)) || 0
  } catch {
    /* almacenamiento bloqueado */
  }
  if (nt === 'reload' && y > 0) return { y }
  const h = HASHES[location.hash]
  if (h) return { hash: h }
  if (nt === 'back_forward' && y > 0) return { y }
  return null
}

/** true si el destino cae por debajo del hero (no repetir la formacion). */
export function restoresDeep(): boolean {
  const t = restoreTarget()
  if (!t) return false
  if ('hash' in t) return t.hash !== '#hero'
  return t.y > window.innerHeight * 0.5
}

/** Guarda scrollY (throttle) para la siguiente recarga. */
export function trackScroll(): () => void {
  let timer = 0
  const save = () => {
    timer = 0
    try {
      sessionStorage.setItem(KEY, String(Math.round(window.scrollY)))
    } catch {
      /* ignorar */
    }
  }
  const onScroll = () => {
    if (!timer) timer = window.setTimeout(save, 200)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pagehide', save)
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('pagehide', save)
    clearTimeout(timer)
  }
}

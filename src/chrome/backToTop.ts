import { scrollToTarget } from '../lib/scroll'

/** Sube al inicio. El retrato se vuelve a armar solo, como funcion pura del scroll (portraitScroll): sin animacion propia. */
export function backToTop() {
  scrollToTarget(0)
}

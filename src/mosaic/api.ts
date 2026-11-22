// API publica del mosaico (singleton). Contrato en DESIGN.md.
import { onFormed, reform, ripple, setDissolve, setPaused, setProgress, setView, stats } from './engine'

export const mosaic = { setProgress, setDissolve, setView, ripple, reform, onFormed, setPaused, stats }

if (import.meta.env.DEV) (window as unknown as { __mosaic: typeof mosaic }).__mosaic = mosaic

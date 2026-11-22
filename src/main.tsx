import { createRoot } from 'react-dom/client'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/geist-mono/wght.css'
import 'lenis/dist/lenis.css'
import './styles/tokens.css'
import './styles/hero.css'
import './styles/fly.css'
import './styles/chrome.css'
import { initScroll } from './lib/scroll'
import App from './App'

initScroll()
// Sin StrictMode: el motor del mosaico es un singleton con formacion unica.
createRoot(document.getElementById('root')!).render(<App />)

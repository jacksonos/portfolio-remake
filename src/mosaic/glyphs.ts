// Atlas offscreen: un sprite por (glifo, nivel de brillo) y por (color de tesela, nivel). Se pinta una sola vez.

export const LEVELS = 8
export const GLYPHS = [...'0123456789ABCDEF', ...'*+=<>XV', '░', '▒', '▓', '█']
// Clases por cobertura de tinta (se miden al construir el atlas): la luminancia elige la clase y los
// cambios de glifo quedan dentro de ella, asi un cambio no altera el brillo medio.
export const CLASSES = 3
const HEAVY = '▓█'

const BLOCKS = '░▒▓█'
const BLOCK_ALPHA = [0.3, 0.5, 0.72, 0.9]
export const PHOS = [61, 255, 114]
// hueso, gris frio claro, gris frio, verde senal, turquesa, ambar
export const TILE_COLORS: [number, number, number][] = [
  [236, 235, 230],
  [167, 172, 180],
  [107, 112, 120],
  [61, 255, 114],
  [92, 225, 230],
  [255, 176, 0],
]

/** alfa del nivel de brillo (0 = penumbra visible, 7 = luz) */
export const levelAlpha = (l: number) => 0.1 + 0.9 * Math.pow(l / (LEVELS - 1), 1.1)

export interface Atlas {
  glyph: HTMLCanvasElement // columnas = niveles, filas = GLYPHS
  tile: HTMLCanvasElement // columnas = niveles, filas = TILE_COLORS
  s: number // lado del sprite en px de dispositivo
  classes: number[][] // indices de glifo por clase de cobertura (0 = menos tinta)
  heavy: number[] // bloques pesados: se asignan una vez y no cambian
}

export function buildAtlas(cellDev: number): Atlas {
  const s = Math.max(4, Math.ceil(cellDev))
  const glyph = document.createElement('canvas')
  glyph.width = LEVELS * s
  glyph.height = GLYPHS.length * s
  const g = glyph.getContext('2d')!
  g.font = `600 ${(s * 0.9).toFixed(1)}px "Geist Mono Variable", ui-monospace, Consolas, monospace`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let r = 0; r < GLYPHS.length; r++)
    for (let l = 0; l < LEVELS; l++) {
      g.fillStyle = `rgba(${PHOS[0]},${PHOS[1]},${PHOS[2]},${levelAlpha(l).toFixed(3)})`
      const bl = BLOCKS.indexOf(GLYPHS[r])
      if (bl >= 0) {
        // bloques dibujados a mano: no dependen de la fuente
        g.save()
        g.globalAlpha = BLOCK_ALPHA[bl]
        const m = Math.max(1, Math.round(s * 0.08))
        g.fillRect(l * s + m, r * s + m, s - 2 * m, s - 2 * m)
        g.restore()
      } else g.fillText(GLYPHS[r], l * s + s / 2, r * s + s / 2 + s * 0.04)
    }

  // cobertura de tinta por glifo (nivel mas alto), ordenada y partida en CLASSES grupos contiguos
  const px = g.getImageData((LEVELS - 1) * s, 0, s, GLYPHS.length * s).data
  const cov = GLYPHS.map((_, r) => {
    let a = 0
    for (let y = r * s; y < (r + 1) * s; y++) for (let x = 0; x < s; x++) a += px[(y * s + x) * 4 + 3]
    return a
  })
  // los bloques pesados no entran en las clases (su tinta es muy distinta): solo se fijan, sin cambiar
  const order = GLYPHS.map((_, r) => r).filter((r) => !HEAVY.includes(GLYPHS[r])).sort((a, b) => cov[a] - cov[b])
  const classes: number[][] = Array.from({ length: CLASSES }, (_, c) =>
    order.slice(Math.round((c * order.length) / CLASSES), Math.round(((c + 1) * order.length) / CLASSES)),
  )
  const heavy = [...HEAVY].map((c) => GLYPHS.indexOf(c))

  const tile = document.createElement('canvas')
  tile.width = LEVELS * s
  tile.height = TILE_COLORS.length * s
  const t = tile.getContext('2d')!
  const gap = Math.max(1, Math.round(s * 0.14))
  for (let r = 0; r < TILE_COLORS.length; r++)
    for (let l = 0; l < LEVELS; l++) {
      const [R, G, B] = TILE_COLORS[r]
      t.fillStyle = `rgba(${R},${G},${B},${(0.16 + 0.84 * Math.pow(l / (LEVELS - 1), 1.1)).toFixed(3)})`
      t.fillRect(l * s + Math.floor(gap / 2), r * s + Math.floor(gap / 2), s - gap, s - gap)
    }
  return { glyph, tile, s, classes, heavy }
}

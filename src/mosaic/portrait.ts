// Campo del retrato: luminancia + mascara por texel. Dos implementaciones:
// busto procedural (por defecto) o public/portrait.jpg convertido en el navegador.

export interface PortraitField {
  width: number
  height: number
  lum: Float32Array // 0..1
  mask: Float32Array // 0..1 (cobertura de la silueta)
  photo?: boolean // retrato real (composicion y tono propios en el motor)
}

export interface ImageOptions {
  threshold: number // luminancia minima para contar como "sujeto" (fotos sin alfa)
  contrast: number // 1 = neutro
}

const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k)
const gauss = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => {
  const dx = (x - cx) / sx, dy = (y - cy) / sy
  return Math.exp(-0.5 * (dx * dx + dy * dy))
}
/** distancia aproximada a una elipse (negativa dentro) */
const sdEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => {
  const dx = (x - cx) / rx, dy = (y - cy) / ry
  return (Math.sqrt(dx * dx + dy * dy) - 1) * Math.min(rx, ry)
}
const dome = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, h: number) => {
  const dx = (x - cx) / rx, dy = (y - cy) / ry
  return h * Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy))
}

/** Disuelve el borde inferior (ultimo ~15% de filas): luminancia a la baja + mascara salteada, sin corte plano. */
function featherBottom(f: PortraitField): PortraitField {
  const { width: W, height: H, lum, mask } = f
  for (let j = Math.floor(H * 0.85); j < H; j++) {
    const keep = 1 - smooth(0.85, 1.0, (j + 0.5) / H)
    for (let i = 0; i < W; i++) {
      const k = j * W + i
      lum[k] *= 0.3 + 0.7 * keep
      if (hash(i * 1.37, j * 2.11) > keep) mask[k] = 0
    }
  }
  return f
}

/** Busto estilizado: silueta por distancias con signo + campo de alturas para el volumen. */
export function proceduralBust(): PortraitField {
  const H = 400
  const A = 1.2 // ancho / alto
  const W = Math.round(H * A)
  const px = 1 / H
  const zs = new Float32Array(W * H)
  const sil = new Float32Array(W * H) // distancia con signo
  const hairW = new Float32Array(W * H)
  const dHs = new Float32Array(W * H) // distancia solo de la cabeza
  const dSs = new Float32Array(W * H) // distancia solo de los hombros

  const neckHalf = (y: number) => 0.066 + 0.07 * smooth(0.48, 0.72, y)

  for (let j = 0; j < H; j++) {
    const y = (j + 0.5) / H
    for (let i = 0; i < W; i++) {
      const x = ((i + 0.5) / W - 0.5) * A
      const ax = Math.abs(x)
      const k = j * W + i

      // --- silueta
      const cran = sdEllipse(x, y, 0, 0.268, 0.15, 0.18)
      const jaw = sdEllipse(x, y, 0, 0.352, 0.122, 0.152)
      let dHead = smin(cran, jaw, 0.04)
      const hair = Math.max(sdEllipse(x, y, 0, 0.226, 0.17, 0.166), y - 0.28)
      dHead = Math.min(dHead, hair)
      const ear = sdEllipse(ax, y, 0.15, 0.315, 0.017, 0.04)
      dHead = Math.min(dHead, ear)
      const neck = Math.max(ax - neckHalf(y), 0.4 - y)
      dHs[k] = dHead
      let d = smin(dHead, neck, 0.03)
      // hombros: superelipse (tope plano, caida redondeada)
      const sx = ax / 0.58, sy = Math.abs(y - 0.99) / 0.37
      const nrm = Math.pow(Math.pow(sx, 2.7) + Math.pow(sy, 2.7), 1 / 2.7)
      const dSh = y < 0.99 ? (nrm - 1) * 0.37 : Math.max((sx - 1) * 0.37, -1)
      dSs[k] = dSh
      d = smin(d, dSh, 0.13)
      sil[k] = d

      // --- zona de pelo (cuero cabelludo + patillas)
      const hairline = 0.205 + 0.03 * Math.pow(Math.min(ax / 0.12, 1.4), 2)
      const above = smooth(hairline + 0.02, hairline - 0.02, y)
      const inHair = smooth(0.012, -0.004, hair)
      hairW[k] = clamp(above) * inHair

      // --- alturas
      const zc = dome(x, y, 0, 0.268, 0.15, 0.18, 0.17)
      const zj = dome(x, y, 0, 0.352, 0.122, 0.152, 0.145)
      let zHead = smax(zc, zj, 0.05)
      const faceW = smooth(0.012, -0.03, smin(cran, jaw, 0.04))
      // relieve facial
      let rel = 0
      rel += 0.026 * gauss(x, y, 0, 0.248, 0.105, 0.012) // arcos superciliares
      rel -= 0.022 * gauss(ax, y, 0.056, 0.272, 0.03, 0.018) // cuencas
      rel += 0.024 * gauss(x, y, 0, 0.34, 0.021, 0.065) // puente nasal
      rel += 0.028 * gauss(x, y, 0, 0.385, 0.024, 0.02) // punta
      rel += 0.014 * gauss(ax, y, 0.027, 0.392, 0.014, 0.012) // alas
      rel += 0.02 * gauss(ax, y, 0.076, 0.338, 0.04, 0.034) // pomulos
      rel -= 0.012 * gauss(ax, y, 0.07, 0.395, 0.025, 0.03) // surco
      rel += 0.014 * gauss(x, y, 0, 0.452, 0.03, 0.01) // labio inferior
      rel += 0.02 * gauss(x, y, 0, 0.49, 0.05, 0.03) // menton
      rel -= 0.012 * gauss(x, y, 0, 0.47, 0.05, 0.012) // surco mentoniano
      zHead += rel * faceW
      const zh = dome(x, y, 0, 0.226, 0.17, 0.166, 0.138)
      const hw = hairW[k]
      zHead = zHead * (1 - hw) + Math.max(zHead, zh) * hw
      const nh = neckHalf(y)
      const zn = ax < nh && y > 0.38 ? 0.07 * Math.sqrt(1 - (ax / nh) * (ax / nh)) * (1 - smooth(0.56, 0.72, y)) * smooth(0, 0.035, dHs[k]) : 0
      const zsh = 0.2 * Math.sqrt(clamp(-dSs[k] / 0.3))
      const zEar = dome(ax, y, 0.15, 0.315, 0.017, 0.04, 0.03)
      const zTrap = dome(x, y, 0, 0.92, 0.46, 0.34, 0.2)
      zs[k] = smax(smax(smax(zHead, zn, 0.03), smax(zsh * (1 - 0.45 * smooth(0, 0.5, ax)), zTrap, 0.06), 0.06), zEar, 0.01)
    }
  }

  const lum = new Float32Array(W * H)
  const mask = new Float32Array(W * H)
  // luz arriba-izquierda-frente
  const lx = -0.5, ly = -0.34, lz = 0.78
  const ll = Math.hypot(lx, ly, lz)
  const Lx = lx / ll, Ly = ly / ll, Lz = lz / ll

  for (let j = 0; j < H; j++) {
    const y = (j + 0.5) / H
    for (let i = 0; i < W; i++) {
      const x = ((i + 0.5) / W - 0.5) * A
      const ax = Math.abs(x)
      const k = j * W + i
      mask[k] = clamp(0.5 - sil[k] / px)
      if (mask[k] <= 0) continue

      const il = Math.max(i - 1, 0), ir = Math.min(i + 1, W - 1)
      const ju = Math.max(j - 1, 0), jd = Math.min(j + 1, H - 1)
      const dzdx = (zs[j * W + ir] - zs[j * W + il]) / ((ir - il) * px)
      const dzdy = (zs[jd * W + i] - zs[ju * W + i]) / ((jd - ju) * px)
      const nl = Math.hypot(dzdx, dzdy, 1)
      const lam = Math.max(0, ((-dzdx * Lx - dzdy * Ly + Lz) / nl + 0.15) / 1.15)
      const fill = Math.max(0, (-dzdx * 0.55 - dzdy * 0.1 + 0.8) / nl) // luz de relleno desde la derecha
      let l = 0.2 + 0.72 * Math.pow(lam, 1.2) + 0.22 * fill * fill

      // sombra de la mandibula sobre el cuello
      if (dHs[k] > -0.006 && y > 0.38 && y < 0.68) l *= 1 - 0.6 * Math.exp(-Math.max(dHs[k], 0) / 0.05)

      // rasgos finos oscuros
      const eye = Math.max(gauss(ax, y, 0.056, 0.276, 0.02, 0.0045), 0)
      const brow = gauss(ax, y, 0.058, 0.252, 0.038, 0.007)
      const nostril = gauss(ax, y, 0.019, 0.403, 0.013, 0.006) + gauss(x, y, 0, 0.408, 0.03, 0.006) * 0.7
      const mouth = gauss(x, y, 0, 0.437, 0.04, 0.0045)
      const faceW2 = smooth(0.0, -0.04, smin(sdEllipse(x, y, 0, 0.268, 0.15, 0.18), sdEllipse(x, y, 0, 0.352, 0.122, 0.152), 0.04))
      l *= 1 - faceW2 * (0.45 * eye + 0.1 * brow + 0.5 * Math.min(nostril, 1) + 0.6 * mouth)

      // pelo: tono mas oscuro con mechas radiales desde la coronilla
      const hw = hairW[k]
      if (hw > 0) {
        const ang = Math.atan2(x - 0.01, y - 0.15)
        const r = Math.hypot(x - 0.01, y - 0.15)
        const streak = vnoise(ang * 6, r * 8) * 0.55 + vnoise(ang * 20, r * 20) * 0.45
        const hl = l * (0.55 + 0.55 * streak)
        l = l * (1 - hw) + hl * hw
      }

      // ropa: trama sutil y algo mas oscura
      if (y > 0.6) {
        const cloth = 0.9 + 0.1 * vnoise(x * 160, y * 160)
        l *= 1 - smooth(0.6, 0.74, y) * (1 - 0.82 * cloth)
      }

      // el pie del busto se apaga para dejar leer el nombre
      l *= 1 - 0.55 * smooth(0.78, 1.0, y)
      lum[k] = clamp(l)
    }
  }
  return featherBottom({ width: W, height: H, lum, mask })
}

/** Convierte una imagen (retrato real) en campo; alfa si existe, si no umbral de luminancia. */
export function fieldFromImage(img: HTMLImageElement, opt: ImageOptions): PortraitField {
  const W = 400
  const H = Math.max(1, Math.round((W * img.naturalHeight) / img.naturalWidth))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const cx = c.getContext('2d', { willReadFrequently: true })!
  cx.drawImage(img, 0, 0, W, H)
  const px = cx.getImageData(0, 0, W, H).data
  const lum = new Float32Array(W * H)
  const mask = new Float32Array(W * H)
  let hasAlpha = false
  for (let k = 0; k < W * H; k++) if (px[k * 4 + 3] < 250) { hasAlpha = true; break }
  for (let k = 0; k < W * H; k++) {
    const l = (0.2126 * px[k * 4] + 0.7152 * px[k * 4 + 1] + 0.0722 * px[k * 4 + 2]) / 255
    lum[k] = clamp((l - 0.5) * opt.contrast + 0.5)
    mask[k] = hasAlpha ? px[k * 4 + 3] / 255 : smooth(opt.threshold - 0.03, opt.threshold + 0.03, l)
  }
  // con alfa el recorte ya trae los bordes difuminados; sin alfa, se disuelve el pie
  const f: PortraitField = { width: W, height: H, lum, mask, photo: true }
  return hasAlpha ? f : featherBottom(f)
}

function tryLoadImage(url: string, ms: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const t = setTimeout(() => resolve(null), ms)
    img.onload = () => { clearTimeout(t); resolve(img.naturalWidth > 0 ? img : null) }
    img.onerror = () => { clearTimeout(t); resolve(null) }
    img.src = url
  })
}

/** public/portrait.png (recorte con alfa), luego portrait.jpg; si ninguno carga, el busto procedural (silencioso). */
export async function loadPortrait(opt: ImageOptions = { threshold: 0.12, contrast: 1.15 }): Promise<PortraitField> {
  const base = import.meta.env.BASE_URL
  const img = (await tryLoadImage(`${base}portrait.png`, 1500)) ?? (await tryLoadImage(`${base}portrait.jpg`, 1500))
  return img ? fieldFromImage(img, opt) : proceduralBust()
}

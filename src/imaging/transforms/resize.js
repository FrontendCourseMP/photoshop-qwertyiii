function resizeNearest(src, newW, newH) {
  const out = new ImageData(newW, newH)
  const s = src.data
  const d = out.data
  const sw = src.width
  const sh = src.height

  for (let y = 0; y < newH; y++) {
    const sy = Math.min(sh - 1, Math.floor((y + 0.5) * sh / newH))
    for (let x = 0; x < newW; x++) {
      const sx = Math.min(sw - 1, Math.floor((x + 0.5) * sw / newW))
      const si = (sy * sw + sx) * 4
      const di = (y * newW + x) * 4
      d[di] = s[si]
      d[di + 1] = s[si + 1]
      d[di + 2] = s[si + 2]
      d[di + 3] = s[si + 3]
    }
  }
  return out
}

// билинейная смешиваем 4 соседних пикселя
function resizeBilinear(src, newW, newH) {
  const out = new ImageData(newW, newH)
  const s = src.data
  const d = out.data
  const sw = src.width
  const sh = src.height

  for (let y = 0; y < newH; y++) {
    const fy = (y + 0.5) * sh / newH - 0.5
    const y0 = Math.floor(fy)
    const wy = fy - y0
    const y0c = Math.max(0, Math.min(sh - 1, y0))
    const y1c = Math.max(0, Math.min(sh - 1, y0 + 1))

    for (let x = 0; x < newW; x++) {
      const fx = (x + 0.5) * sw / newW - 0.5
      const x0 = Math.floor(fx)
      const wx = fx - x0
      const x0c = Math.max(0, Math.min(sw - 1, x0))
      const x1c = Math.max(0, Math.min(sw - 1, x0 + 1))

      const di = (y * newW + x) * 4
      const i00 = (y0c * sw + x0c) * 4
      const i10 = (y0c * sw + x1c) * 4
      const i01 = (y1c * sw + x0c) * 4
      const i11 = (y1c * sw + x1c) * 4

      for (let c = 0; c < 4; c++) {
        const top = s[i00 + c] + (s[i10 + c] - s[i00 + c]) * wx
        const bot = s[i01 + c] + (s[i11 + c] - s[i01 + c]) * wx
        d[di + c] = Math.round(top + (bot - top) * wy)
      }
    }
  }
  return out
}

// список методов новые добавлять сюда
export const METHODS = [
  {
    id: 'bilinear',
    label: 'Билинейная',
    tip: 'смешивает 4 соседних пикселя, картинка плавная, лучше для увеличения',
    fn: resizeBilinear,
  },
  {
    id: 'nearest',
    label: 'Ближайший сосед',
    tip: 'берёт ближайший пиксель, быстро, но видны ступеньки',
    fn: resizeNearest,
  },
]

// главная функция ресайза по id метода
export function resizeImage(imageData, newW, newH, methodId = 'bilinear') {
  const method = METHODS.find((m) => m.id === methodId) || METHODS[0]
  return method.fn(imageData, newW, newH)
}
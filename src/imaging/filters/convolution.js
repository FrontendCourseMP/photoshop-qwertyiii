// преднастройки ядро 3x3 по строкам сверху вниз
export const PRESETS = [
  { id: 'identity', label: 'Тождественное', kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
  { id: 'sharpen', label: 'Повышение резкости', kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  { id: 'gaussian', label: 'Гаусса 3×3', kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1] },
  { id: 'box', label: 'Прямоугольное размытие', kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 'prewittX', label: 'Прюитт горизонтальный', kernel: [-1, 0, 1, -1, 0, 1, -1, 0, 1] },
  { id: 'prewittY', label: 'Прюитт вертикальный', kernel: [-1, -1, -1, 0, 0, 0, 1, 1, 1] },
]

// сумма коэффициентов ядра
function kernelSum(kernel) {
  let s = 0
  for (let i = 0; i < 9; i++) s += kernel[i]
  return s
}

// какой канал берётся 0 r 1 g 2 b 3 a
function channelOn(c, channels) {
  if (c === 0) return channels.r
  if (c === 1) return channels.g
  if (c === 2) return channels.b
  return channels.a
}

// значение пикселя с обработкой края
function sample(data, w, h, x, y, c, edge) {
  if (x < 0 || x >= w || y < 0 || y >= h) {
    if (edge === 'black') return 0
    if (edge === 'white') return 255
    // copy край расширяется крайними пикселями
    if (x < 0) x = 0
    else if (x >= w) x = w - 1
    if (y < 0) y = 0
    else if (y >= h) y = h - 1
  }
  return data[(y * w + x) * 4 + c]
}

// ядро применяется асинхронно чтобы интерфейс не висел
// shouldStop для отмены устаревшего расчёта
export async function applyConvolution(imageData, kernel, channels, edge, shouldStop) {
  const w = imageData.width
  const h = imageData.height
  const src = imageData.data
  const out = new ImageData(w, h)
  const dst = out.data

  // нормировка по сумме чтобы яркость не менялась
  const sum = kernelSum(kernel)
  const div = sum !== 0 ? sum : 1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4
      for (let c = 0; c < 4; c++) {
        if (channelOn(c, channels)) {
          let acc = 0
          let ki = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              acc += kernel[ki] * sample(src, w, h, x + kx, y + ky, c, edge)
              ki++
            }
          }
          dst[di + c] = acc / div
        } else {
          // канал не выбран значение копируется как есть
          dst[di + c] = src[di + c]
        }
      }
    }
    // каждые 32 строки управление отдаётся интерфейсу
    if (y % 32 === 0) {
      await new Promise((r) => setTimeout(r, 0))
      if (shouldStop && shouldStop()) return null
    }
  }
  return out
}
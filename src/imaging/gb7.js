// кодер и декодер формата gb7
// заголовок 12 байт + пиксели (w*h байт по 1 на пиксель)
// в байте младшие 7 бит яркость 0..127, старший бит маска

const SIGNATURE = [0x47, 0x42, 0x37, 0x1d] // "GB7·"
const VERSION = 0x01
const HEADER_SIZE = 12

// разворачиваем 7 бит (0..127) в 8 бит (0..255) и обратно
function expand7to8(v) {
  return Math.round((v * 255) / 127)
}

function compress8to7(v) {
  return Math.round((v * 127) / 255)
}

// принимает arraybuffer или uint8array, отдаёт объект картинки
export function decodeGB7(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

  if (bytes.length < HEADER_SIZE) {
    throw new Error('Файл слишком маленький для GB7')
  }
  for (let i = 0; i < SIGNATURE.length; i++) {
    if (bytes[i] !== SIGNATURE[i]) {
      throw new Error('Неверная сигнатура GB7')
    }
  }

  const version = bytes[4]
  if (version !== VERSION) {
    throw new Error('Неподдерживаемая версия GB7: ' + version)
  }

  const flags = bytes[5]
  const hasMask = (flags & 0x01) === 1

  // ширина и высота big-endian
  const width = (bytes[6] << 8) | bytes[7]
  const height = (bytes[8] << 8) | bytes[9]

  const pixelCount = width * height
  if (bytes.length < HEADER_SIZE + pixelCount) {
    throw new Error('Данных пикселей меньше, чем ожидается по размеру')
  }

  // собираем rgba для canvas
  const imageData = new ImageData(width, height)
  const rgba = imageData.data

  for (let i = 0; i < pixelCount; i++) {
    const raw = bytes[HEADER_SIZE + i]
    const gray = expand7to8(raw & 0x7f)
    // если маска есть старший бит это видимость, иначе непрозрачный
    const alpha = hasMask ? ((raw & 0x80) !== 0 ? 255 : 0) : 255

    const o = i * 4
    rgba[o] = gray
    rgba[o + 1] = gray
    rgba[o + 2] = gray
    rgba[o + 3] = alpha
  }

  return {
    imageData,
    width,
    height,
    depth: hasMask ? 8 : 7,
    channels: 1,
    format: 'gb7',
  }
}

// принимает imagedata, отдаёт blob gb7
// маска пишется если есть прозрачные пиксели
export function encodeGB7(imageData) {
  const { width, height, data } = imageData
  const pixelCount = width * height

  // нужна ли маска: если есть хоть один не до конца непрозрачный пиксель
  let hasMask = false
  for (let i = 0; i < pixelCount; i++) {
    if (data[i * 4 + 3] < 255) {
      hasMask = true
      break
    }
  }

  const out = new Uint8Array(HEADER_SIZE + pixelCount)

  // заголовок
  out[0] = SIGNATURE[0]
  out[1] = SIGNATURE[1]
  out[2] = SIGNATURE[2]
  out[3] = SIGNATURE[3]
  out[4] = VERSION
  out[5] = hasMask ? 0x01 : 0x00
  out[6] = (width >> 8) & 0xff
  out[7] = width & 0xff
  out[8] = (height >> 8) & 0xff
  out[9] = height & 0xff
  out[10] = 0x00
  out[11] = 0x00

  // пиксели
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const a = data[o + 3]

    // яркость по формуле, потом сжимаем в 0..127
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    let value = compress8to7(y) & 0x7f

    if (hasMask && a > 127) {
      value |= 0x80 // бит маски = 1 видимый
    }

    out[HEADER_SIZE + i] = value
  }

  return new Blob([out], { type: 'application/octet-stream' })
}

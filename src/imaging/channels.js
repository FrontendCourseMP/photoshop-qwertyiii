// каналы у картинки: gray для gb7, иначе rgb плюс alpha при наличии прозрачности
export function getChannels(image) {
  const isGray = image.format === 'gb7'
  const hasAlpha = image.depth === 32 || image.depth === 8
  const keys = isGray ? ['gray'] : ['r', 'g', 'b']
  if (hasAlpha) keys.push('a')
  return keys
}

// уопия пикселей с учётом включённых каналов
export function applyChannels(image, visibility) {
  const src = image.imageData.data
  const out = new Uint8ClampedArray(src.length)

  const channels = getChannels(image)
  const isGray = channels.includes('gray')
  const hasAlpha = channels.includes('a')

  // если ни один цветной канал не включён, а альфа включена — рисуем маску прозрачности
  const colorKeys = isGray ? ['gray'] : ['r', 'g', 'b']
  const anyColor = colorKeys.some((k) => visibility[k])
  const onlyAlpha = hasAlpha && visibility.a && !anyColor

  for (let i = 0; i < src.length; i += 4) {
    if (onlyAlpha) {
      const m = src[i + 3] // яркость маски = значение альфы
      out[i] = m
      out[i + 1] = m
      out[i + 2] = m
      out[i + 3] = 255
      continue
    }

    if (isGray) {
      const v = visibility.gray ? src[i] : 0 // у gb7 r=g=b
      out[i] = v
      out[i + 1] = v
      out[i + 2] = v
    } else {
      out[i] = visibility.r ? src[i] : 0
      out[i + 1] = visibility.g ? src[i + 1] : 0
      out[i + 2] = visibility.b ? src[i + 2] : 0
    }

    out[i + 3] = hasAlpha ? (visibility.a ? src[i + 3] : 255) : 255
  }

  return new ImageData(out, image.width, image.height)
}

// превью каждого канала r/g/b
export function makeThumbnails(imageData, channels, size = 64) {
  const w = imageData.width
  const h = imageData.height

  const full = document.createElement('canvas')
  full.width = w
  full.height = h
  full.getContext('2d').putImageData(imageData, 0, 0)

  const ratio = Math.min(size / w, size / h)
  const dw = Math.max(1, Math.round(w * ratio))
  const dh = Math.max(1, Math.round(h * ratio))

  const base = document.createElement('canvas')
  base.width = dw
  base.height = dh
  const baseCtx = base.getContext('2d')
  baseCtx.drawImage(full, 0, 0, dw, dh)
  const small = baseCtx.getImageData(0, 0, dw, dh).data

  const result = {}
  channels.forEach((key) => {
    const out = new Uint8ClampedArray(small.length)
    for (let i = 0; i < small.length; i += 4) {
      const r = small[i]
      const g = small[i + 1]
      const b = small[i + 2]
      const a = small[i + 3]
      if (key === 'r') { out[i] = r; out[i + 1] = 0; out[i + 2] = 0 }
      else if (key === 'g') { out[i] = 0; out[i + 1] = g; out[i + 2] = 0 }
      else if (key === 'b') { out[i] = 0; out[i + 1] = 0; out[i + 2] = b }
      else if (key === 'a') { out[i] = a; out[i + 1] = a; out[i + 2] = a } // альфа серой
      else { out[i] = r; out[i + 1] = r; out[i + 2] = r } // gray (r=g=b)
      out[i + 3] = 255
    }

    const thumb = document.createElement('canvas')
    thumb.width = size
    thumb.height = size
    const ctx = thumb.getContext('2d')
    ctx.fillStyle = '#21252b'
    ctx.fillRect(0, 0, size, size)

    const tmp = document.createElement('canvas')
    tmp.width = dw
    tmp.height = dh
    tmp.getContext('2d').putImageData(new ImageData(out, dw, dh), 0, 0)
    ctx.drawImage(tmp, Math.floor((size - dw) / 2), Math.floor((size - dh) / 2))

    result[key] = thumb.toDataURL('image/png')
  })

  return result
}
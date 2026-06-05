// яркость пикселя как при сером
function luma(r, g, b) {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

// channel rgb r g b или a
// сколько пикселей с каждой светлотой
export function computeHistogram(imageData, channel) {
  const data = imageData.data
  const hist = new Array(256).fill(0)

  for (let i = 0; i < data.length; i += 4) {
    let value
    if (channel === 'r') value = data[i]
    else if (channel === 'g') value = data[i + 1]
    else if (channel === 'b') value = data[i + 2]
    else if (channel === 'a') value = data[i + 3]
    else value = luma(data[i], data[i + 1], data[i + 2])
    hist[value]++
  }
  return hist
}

// bp чёрная точка wp белая gamma полутона
export function buildLUT(bp, wp, gamma) {
  const lut = new Uint8ClampedArray(256)
  const range = wp - bp
  for (let r = 0; r < 256; r++) {
    let t = (r - bp) / range
    if (t < 0) t = 0
    if (t > 1) t = 1
    t = Math.pow(t, gamma)
    lut[r] = Math.round(t * 255)
  }
  return lut
}

// levels rgb r g b a у каждого bp wp gamma
export function applyLevels(imageData, levels) {
  const src = imageData.data
  const out = new ImageData(imageData.width, imageData.height)
  const dst = out.data
  const lutM = buildLUT(levels.rgb.bp, levels.rgb.wp, levels.rgb.gamma)
  const lutR = buildLUT(levels.r.bp, levels.r.wp, levels.r.gamma)
  const lutG = buildLUT(levels.g.bp, levels.g.wp, levels.g.gamma)
  const lutB = buildLUT(levels.b.bp, levels.b.wp, levels.b.gamma)
  const lutA = buildLUT(levels.a.bp, levels.a.wp, levels.a.gamma)

  for (let i = 0; i < src.length; i += 4) {
    dst[i]     = lutM[lutR[src[i]]]
    dst[i + 1] = lutM[lutG[src[i + 1]]]
    dst[i + 2] = lutM[lutB[src[i + 2]]]
    dst[i + 3] = lutA[src[i + 3]]
  }
  return out
}
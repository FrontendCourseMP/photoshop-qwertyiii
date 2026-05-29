function srgbToLinear(value) {
  const c = value / 255
  if (c <= 0.04045) return c / 12.92
  return Math.pow((c + 0.055) / 1.055, 2.4)
}

function pivot(value) {
  const epsilon = 216 / 24389
  const kappa = 24389 / 27
  if (value > epsilon) return Math.cbrt(value)
  return (kappa * value + 16) / 116
}

export function rgbToCielab(r, g, b) {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)

  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750
  const z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041

  const fx = pivot(x / 0.95047)
  const fy = pivot(y / 1.0)
  const fz = pivot(z / 1.08883)

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}
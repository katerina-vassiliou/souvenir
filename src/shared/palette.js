const MIN_DISTANCE = 32
const MIN_SHARE = 0.0015
const DEFAULT_SIZE = 8

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

export function toHex([r, g, b]) {
  return `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

function countColours(rgba) {
  const bins = new Map()
  let total = 0
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue
    const key = ((rgba[i] >> 3) << 10) | ((rgba[i + 1] >> 3) << 5) | (rgba[i + 2] >> 3)
    const bin = bins.get(key) || { count: 0, sum: [0, 0, 0] }
    bin.count++
    bin.sum[0] += rgba[i]
    bin.sum[1] += rgba[i + 1]
    bin.sum[2] += rgba[i + 2]
    bins.set(key, bin)
    total++
  }
  const colours = [...bins.values()].map(({ count, sum }) => ({
    count,
    rgb: sum.map(value => value / count),
  }))
  return { colours, total }
}

function pickDistinct(colours, total, size) {
  const candidates = colours
    .filter(({ count }) => count / total >= MIN_SHARE)
    .sort((a, b) => b.count - a.count)
  const chosen = candidates.slice(0, 1)
  while (chosen.length < size) {
    let best = null
    let bestScore = 0
    for (const candidate of candidates) {
      const gap = Math.min(...chosen.map(({ rgb }) => distance(rgb, candidate.rgb)))
      if (gap < MIN_DISTANCE) continue
      const score = gap * Math.sqrt(candidate.count)
      if (score > bestScore) {
        best = candidate
        bestScore = score
      }
    }
    if (!best) break
    chosen.push(best)
  }
  return chosen
}

export function extractPalette(rgba, size = DEFAULT_SIZE) {
  const { colours, total } = countColours(rgba)
  if (!total) return []

  const groups = pickDistinct(colours, total, size).map(({ rgb }) => ({
    seed: rgb,
    count: 0,
    sum: [0, 0, 0],
  }))
  for (const { count, rgb } of colours) {
    const nearest = groups.reduce((a, b) => (distance(a.seed, rgb) <= distance(b.seed, rgb) ? a : b))
    nearest.count += count
    for (let i = 0; i < 3; i++) nearest.sum[i] += rgb[i] * count
  }

  return groups
    .sort((a, b) => b.count - a.count)
    .map(({ count, sum }) => {
      const rgb = sum.map(value => Math.round(value / count))
      return { hex: toHex(rgb), rgb, share: Math.round((count / total) * 100) / 100 }
    })
}

export function paletteJson(name, colors) {
  return JSON.stringify({ name, colors }, null, 2)
}

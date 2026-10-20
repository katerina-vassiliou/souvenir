const MAX_SIDE = 16000
const MAX_AREA = 240_000_000

export function fitPixelRatio(width, height, wanted) {
  const bySide = MAX_SIDE / Math.max(width, height)
  const byArea = Math.sqrt(MAX_AREA / (width * height))
  return Math.min(wanted, bySide, byArea)
}

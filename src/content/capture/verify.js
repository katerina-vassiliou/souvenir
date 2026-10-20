const MAX_IMAGES = 8
const MIN_SIDE = 60
const GRID = 12
const DETAILED = 25
const FLAT = 20

function spread(source, x, y, width, height) {
  const probe = document.createElement('canvas')
  probe.width = probe.height = GRID
  const context = probe.getContext('2d', { willReadFrequently: true })
  context.drawImage(source, x, y, width, height, 0, 0, GRID, GRID)
  const { data } = context.getImageData(0, 0, GRID, GRID)
  const values = []
  for (let i = 0; i < data.length; i += 4)
    values.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)
}

async function decode(dataUrl) {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  return image
}

export async function countBlankImages(el, canvas, pixelRatio, fetched) {
  const origin = el.getBoundingClientRect()
  const candidates = [...el.querySelectorAll('img')]
    .map(image => ({ image, rect: image.getBoundingClientRect() }))
    .filter(
      ({ image, rect }) =>
        rect.width >= MIN_SIDE && rect.height >= MIN_SIDE && fetched.has(image.currentSrc || image.src)
    )
    .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)
    .slice(0, MAX_IMAGES)

  let blank = 0
  for (const { image, rect } of candidates) {
    const x = Math.round((rect.left - origin.left) * pixelRatio)
    const y = Math.round((rect.top - origin.top) * pixelRatio)
    const width = Math.round(rect.width * pixelRatio)
    const height = Math.round(rect.height * pixelRatio)
    if (x < 0 || y < 0 || x + width > canvas.width || y + height > canvas.height) continue
    try {
      const original = await decode(fetched.get(image.currentSrc || image.src))
      const expected = spread(original, 0, 0, original.naturalWidth, original.naturalHeight)
      if (expected >= DETAILED && spread(canvas, x, y, width, height) <= FLAT) blank++
    } catch {
      blank++
    }
  }
  return blank
}

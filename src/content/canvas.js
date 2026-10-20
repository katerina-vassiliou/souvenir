import { BACKGROUND_FILLS } from '../shared/settings.js'

export function roundCorners(canvas, radii, pixelRatio) {
  if (!radii.some(radius => radius > 0)) return canvas
  const output = document.createElement('canvas')
  output.width = canvas.width
  output.height = canvas.height
  const context = output.getContext('2d')
  context.beginPath()
  context.roundRect(
    0,
    0,
    output.width,
    output.height,
    radii.map(radius => radius * pixelRatio)
  )
  context.clip()
  context.drawImage(canvas, 0, 0)
  return output
}

export function addFrame(canvas, { background, padding }, pixelRatio) {
  const fill = BACKGROUND_FILLS[background]
  const margin = Math.round(padding * pixelRatio)
  if (!fill && !margin) return canvas
  const output = document.createElement('canvas')
  output.width = canvas.width + margin * 2
  output.height = canvas.height + margin * 2
  const context = output.getContext('2d')
  if (fill) {
    context.fillStyle = fill
    context.fillRect(0, 0, output.width, output.height)
  }
  context.drawImage(canvas, margin, margin)
  return output
}

export function scaleDown(canvas, maxSide) {
  const ratio = Math.min(1, maxSide / Math.max(canvas.width, canvas.height))
  if (ratio === 1) return canvas
  const output = document.createElement('canvas')
  output.width = Math.max(1, Math.round(canvas.width * ratio))
  output.height = Math.max(1, Math.round(canvas.height * ratio))
  output.getContext('2d').drawImage(canvas, 0, 0, output.width, output.height)
  return output
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode the image'))),
      type,
      quality
    )
  })
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

import { extractPalette, paletteJson } from '../shared/palette.js'
import { loadImage } from '../shared/souvenirs.js'
import { displayName } from './format.js'
import { say } from './toast.js'

export async function copySouvenir(souvenir) {
  try {
    const blob = await (await fetch(await loadImage(souvenir.id))).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    say('Copied')
  } catch {
    say('Couldn’t copy')
  }
}

export async function downloadSouvenir(souvenir) {
  const base = (souvenir.name || souvenir.host || 'souvenir')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const link = document.createElement('a')
  link.href = await loadImage(souvenir.id)
  link.download = `souvenir-${base || 'souvenir'}.png`
  link.click()
}

const SAMPLE_SIDE = 96

export async function readPalette(souvenir) {
  const image = new Image()
  image.src = await loadImage(souvenir.id)
  await image.decode()
  const scale = Math.min(1, SAMPLE_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.round(image.naturalWidth * scale)),
    Math.max(1, Math.round(image.naturalHeight * scale))
  )
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return extractPalette(context.getImageData(0, 0, canvas.width, canvas.height).data)
}

export async function copyPalette(souvenir) {
  try {
    const colors = await readPalette(souvenir)
    if (!colors.length) return say('No colours to copy')
    await navigator.clipboard.writeText(paletteJson(displayName(souvenir), colors))
    say('Palette copied')
  } catch {
    say('Couldn’t copy')
  }
}

export async function copyText(value, message) {
  try {
    await navigator.clipboard.writeText(value)
    say(message)
  } catch {
    say('Couldn’t copy')
  }
}

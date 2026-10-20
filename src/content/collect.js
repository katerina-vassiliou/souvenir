import { Message } from '../shared/messages.js'
import { loadSettings } from '../shared/settings.js'
import { addFrame, blobToDataUrl, canvasToBlob, roundCorners, scaleDown } from './canvas.js'
import { renderElement } from './capture/index.js'
import { describeElement, readCornerRadii } from './dom.js'
import { playLiftAnimation } from './effects/lift-animation.js'
import { showToast } from './toast.js'

async function copyToClipboard(blob) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

function download(blob, name) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${name.replace(/[^\w.-]+/g, '-')}.png`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// The animation draws the image twice with a shadow, so it uses a small copy.
const PREVIEW_MAX_SIDE = 800
const THUMB_MAX_SIDE = 480

const openCollection = () => chrome.runtime.sendMessage({ type: Message.OPEN_COLLECTION })

async function makeImage(el, settings) {
  const box = el.getBoundingClientRect()
  const radii = readCornerRadii(el, box.width, box.height)
  const started = performance.now()
  const { canvas, pixelRatio, method } = await renderElement(el, settings.method)
  console.debug(`[Souvenir] ${method} took ${Math.round(performance.now() - started)} ms`)
  const framed = addFrame(roundCorners(canvas, radii, pixelRatio), settings, pixelRatio)
  return {
    blob: await canvasToBlob(framed),
    preview: await canvasToBlob(scaleDown(framed, PREVIEW_MAX_SIDE)),
    thumb: await canvasToBlob(scaleDown(framed, THUMB_MAX_SIDE), 'image/webp', 0.85),
    width: Math.round(box.width) + settings.padding * 2,
    height: Math.round(box.height) + settings.padding * 2,
  }
}

async function keep(el, image) {
  const souvenir = {
    png: await blobToDataUrl(image.blob),
    thumb: await blobToDataUrl(image.thumb),
    w: image.width,
    h: image.height,
    host: location.hostname,
    url: location.href,
    title: document.title,
    label: describeElement(el),
  }
  await chrome.runtime.sendMessage({ type: Message.KEEP, souvenir })
}

function offerNextSteps(el, image, copied, settings) {
  const size = `${image.width} × ${image.height}`
  const openAction = { label: 'Open collection', run: ({ close }) => (openCollection(), close()) }
  const keepAction = {
    label: 'Keep in collection',
    run: async toast => {
      await keep(el, image)
      toast.update('Kept in your collection', [openAction], 4000)
    },
  }

  if (!copied) {
    const copyAction = {
      label: 'Copy image',
      run: async toast =>
        toast.update((await copyToClipboard(image.blob)) ? 'Copied' : 'Couldn’t copy', [keepAction]),
    }
    const downloadAction = { label: 'Download', run: () => download(image.blob, describeElement(el)) }
    showToast(`Collected ${size}`, [copyAction, downloadAction, keepAction], { lifetime: 12_000 })
  } else if (settings.autoKeep) {
    showToast(`Collected ${size} and copied. In your collection`, [openAction])
  } else {
    showToast(`Collected ${size} and copied`, [keepAction])
  }
}

export async function collect(el) {
  const progress = showToast('Collecting…', [], { lifetime: 120_000 })
  try {
    const settings = await loadSettings()
    const image = await makeImage(el, settings)
    const copied = await copyToClipboard(image.blob)
    if (settings.autoKeep) await keep(el, image)

    progress.close()
    const previewUrl = URL.createObjectURL(image.preview)
    await playLiftAnimation(el, previewUrl)
    URL.revokeObjectURL(previewUrl)
    offerNextSteps(el, image, copied, settings)
  } catch (error) {
    progress.close()
    showToast('Couldn’t collect that element')
    console.error('[Souvenir]', error)
  }
}

import { domToCanvas } from '../../../vendor/modern-screenshot.mjs'
import { blobToDataUrl } from '../canvas.js'
import { withTimeout } from '../dom.js'
import { loadLazyImages } from './lazy.js'
import { countBlankImages } from './verify.js'
import { fitPixelRatio } from './limits.js'

const RENDER_TIMEOUT_MS = 15000

const BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

function createImageFetcher() {
  let failed = 0
  const fetched = new Map()
  const fetchImage = async url => {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const dataUrl = await blobToDataUrl(await response.blob())
        fetched.set(url, dataUrl)
        return dataUrl
      }
    } catch {
      // The site does not let this page read the image.
    }
    failed++
    return BLANK_IMAGE
  }
  return { fetchImage, fetched, failures: () => failed }
}

export async function renderByDom(el) {
  const { width, height } = el.getBoundingClientRect()
  const pixelRatio = fitPixelRatio(width, height, window.devicePixelRatio)
  const stillLoading = await loadLazyImages(el)
  const { fetchImage, fetched, failures } = createImageFetcher()
  const canvas = await withTimeout(
    domToCanvas(el, {
      scale: pixelRatio,
      backgroundColor: null,
      fetchFn: fetchImage,
      timeout: RENDER_TIMEOUT_MS,
    }),
    RENDER_TIMEOUT_MS,
    'Rendering took too long'
  )
  return {
    canvas,
    pixelRatio,
    method: 'render',
    missingImages: stillLoading + failures() + (await countBlankImages(el, canvas, pixelRatio, fetched)),
  }
}

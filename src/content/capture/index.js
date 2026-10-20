import { CaptureMethod } from '../../shared/settings.js'

// Content a DOM render cannot reproduce faithfully.
const NEEDS_PIXELS = 'iframe, video, embed, object'

const renderByDom = async el => (await import('./render.js')).renderByDom(el)
const renderByScreenshot = async el => (await import('./screenshot.js')).renderByScreenshot(el)

export async function renderElement(el, method) {
  if (method === CaptureMethod.RENDER) return renderByDom(el)
  if (method === CaptureMethod.SCREENSHOT) return renderByScreenshot(el)
  if (el.querySelector(NEEDS_PIXELS)) return renderByScreenshot(el)
  try {
    const result = await renderByDom(el)
    if (!result.missingImages) return result
    console.debug(`[Souvenir] ${result.missingImages} images did not load, using a screenshot instead`)
  } catch (error) {
    console.debug('[Souvenir] render failed, using a screenshot instead:', error)
  }
  return renderByScreenshot(el)
}

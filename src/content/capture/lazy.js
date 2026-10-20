import { nextFrame, sleep } from '../dom.js'
import { rememberScroll, scrollContainersOf, scrollTo } from './scrolling.js'

const STEP_WAIT_MS = 140
const IMAGE_WAIT_MS = 4000
const MAX_STEPS = 60

const isLoaded = image => image.complete && image.naturalWidth > 0
const isVisibleSize = image => image.getBoundingClientRect().width > 8

export function findUnloadedImages(el) {
  return [...el.querySelectorAll('img')].filter(image => isVisibleSize(image) && !isLoaded(image))
}

async function scrollThrough(el) {
  const containers = scrollContainersOf(el)
  const restore = rememberScroll(containers)
  const height = el.getBoundingClientRect().height
  const step = document.documentElement.clientHeight * 0.8
  try {
    for (let y = 0, steps = 0; y < height && steps < MAX_STEPS; y += step, steps++) {
      scrollTo(el, containers, 0, y)
      await sleep(STEP_WAIT_MS)
    }
  } finally {
    restore()
    await nextFrame()
  }
}

export async function loadLazyImages(el) {
  const native = [...el.querySelectorAll('img[loading="lazy"]')].filter(image => !image.complete)
  for (const image of native) image.loading = 'eager'

  if (findUnloadedImages(el).length) await scrollThrough(el)

  const waiting = findUnloadedImages(el)
  await Promise.race([
    Promise.all(waiting.map(image => image.decode().catch(() => {}))),
    sleep(IMAGE_WAIT_MS),
  ])

  for (const image of native) image.loading = 'lazy'
  return findUnloadedImages(el).length
}

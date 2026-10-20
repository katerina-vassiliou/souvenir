import { Message } from '../../shared/messages.js'
import { nextFrame, sleep } from '../dom.js'
import { fitPixelRatio } from './limits.js'
import { rememberScroll, scrollContainersOf, scrollTo } from './scrolling.js'

// Chrome allows about two tab screenshots per second.
const SCREENSHOT_GAP_MS = 650
const SETTLE_MS = 220
const ANIMATION_WAIT_MS = 1800
const MAX_ROWS = 120
const MAX_COLUMNS = 40

function findFloatingElements(el) {
  return [...document.querySelectorAll('body *')].filter(node => {
    if (node.contains(el) || el.contains(node)) return false
    const { position } = getComputedStyle(node)
    return position === 'fixed' || position === 'sticky'
  })
}

function visibleRegion(el) {
  const root = document.documentElement
  const box = el.getBoundingClientRect()
  let left = Math.max(box.left, 0)
  let top = Math.max(box.top, 0)
  let right = Math.min(box.right, root.clientWidth)
  let bottom = Math.min(box.bottom, root.clientHeight)
  for (
    let node = el.parentElement;
    node && node !== root && node !== document.body;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node)
    if (!/(auto|scroll|hidden|clip)/.test(style.overflowX + style.overflowY)) continue
    const rect = node.getBoundingClientRect()
    left = Math.max(left, rect.left + node.clientLeft)
    top = Math.max(top, rect.top + node.clientTop)
    right = Math.min(right, rect.left + node.clientLeft + node.clientWidth)
    bottom = Math.min(bottom, rect.top + node.clientTop + node.clientHeight)
  }
  return { left, top, right, bottom, box }
}

async function waitForAnimations() {
  const running = document
    .getAnimations()
    .filter(
      animation =>
        animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity
    )
  if (!running.length) return
  await Promise.race([
    Promise.all(running.map(animation => animation.finished.catch(() => {}))),
    sleep(ANIMATION_WAIT_MS),
  ])
  await nextFrame()
}

async function screenshotTab() {
  const response = await chrome.runtime.sendMessage({ type: Message.CAPTURE_TAB })
  if (!response?.dataUrl) throw new Error(response?.error ?? 'Could not capture the tab')
  const image = new Image()
  image.src = response.dataUrl
  await image.decode()
  return image
}

function setVisibility(nodes, value) {
  for (const node of nodes) {
    if (value) node.style.setProperty('visibility', value, 'important')
    else node.style.removeProperty('visibility')
  }
}

function prepareForCapture(el) {
  const root = document.documentElement
  const containers = scrollContainersOf(el)
  const floating = findFloatingElements(el)
  const restoreScroll = rememberScroll(containers)
  const previousBehavior = root.style.scrollBehavior

  root.style.scrollBehavior = 'auto'
  setVisibility(floating, 'hidden')

  return {
    containers,
    restore() {
      setVisibility(floating, '')
      restoreScroll()
      root.style.scrollBehavior = previousBehavior
    },
  }
}

async function settle(lastShot) {
  await nextFrame()
  await sleep(SETTLE_MS)
  await waitForAnimations()
  await sleep(Math.max(0, SCREENSHOT_GAP_MS - (Date.now() - lastShot)))
}

function drawRegion(canvas, image, region, ratios) {
  const { shot, output } = ratios
  const sourceX = Math.round(region.left * shot)
  const sourceY = Math.round(region.top * shot)
  const destX = Math.round((region.left - region.box.left) * output)
  const destY = Math.round((region.top - region.box.top) * output)
  canvas
    .getContext('2d')
    .drawImage(
      image,
      sourceX,
      sourceY,
      Math.round(region.right * shot) - sourceX,
      Math.round(region.bottom * shot) - sourceY,
      destX,
      destY,
      Math.round((region.right - region.box.left) * output) - destX,
      Math.round((region.bottom - region.box.top) * output) - destY
    )
}

const isEmpty = region => region.right <= region.left || region.bottom <= region.top

export async function renderByScreenshot(el) {
  const root = document.documentElement
  const { width: boxWidth, height: boxHeight } = el.getBoundingClientRect()
  const width = Math.max(1, Math.round(boxWidth))
  const height = Math.max(1, Math.round(boxHeight))
  const { containers, restore } = prepareForCapture(el)

  let canvas = null
  let pixelRatio = 1
  let lastShot = 0

  try {
    for (let y = 0, rows = 0; y < height && rows < MAX_ROWS; rows++) {
      let rowBottom = y
      for (let x = 0, columns = 0; x < width && columns < MAX_COLUMNS; columns++) {
        scrollTo(el, containers, x, y)
        await settle(lastShot)

        const region = visibleRegion(el)
        if (isEmpty(region)) {
          x += root.clientWidth
          continue
        }

        const image = await screenshotTab()
        lastShot = Date.now()
        const shotRatio = image.width / window.innerWidth
        pixelRatio = fitPixelRatio(width, height, shotRatio)
        canvas ??= Object.assign(document.createElement('canvas'), {
          width: Math.round(width * pixelRatio),
          height: Math.round(height * pixelRatio),
        })
        drawRegion(canvas, image, region, { shot: shotRatio, output: pixelRatio })

        const right = region.right - region.box.left
        rowBottom = Math.max(rowBottom, region.bottom - region.box.top)
        x = right > x + 0.5 ? right : x + root.clientWidth
      }
      y = rowBottom > y + 0.5 ? rowBottom : y + root.clientHeight
    }
  } finally {
    restore()
  }
  return { canvas, pixelRatio, method: 'screenshot' }
}

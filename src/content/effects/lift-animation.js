import { createOverlay } from '../overlay.js'

const FOLD_MS = 340
const HOLD_MS = 140
const LIFT_MS = 300
const MAX_FOLD = 24

const easeOut = t => 1 - (1 - t) ** 3

function fitInViewport(rect) {
  const scale = Math.min(1, (innerWidth * 0.8) / rect.width, (innerHeight * 0.8) / rect.height)
  const width = rect.width * scale
  const height = rect.height * scale
  const clamp = (value, max) => Math.min(Math.max(value, 8), Math.max(8, max - 8))
  return {
    scale,
    width,
    height,
    left: clamp(rect.left + rect.width / 2 - width / 2, innerWidth - width),
    top: clamp(rect.top + rect.height / 2 - height / 2, innerHeight - height),
  }
}

function isOnScreen(rect) {
  return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
}

const styles = ({ left, top, width, height }, radii) => `
  .souvenir { position: fixed; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .14)); transition: transform ${LIFT_MS}ms ease, opacity ${LIFT_MS}ms ease; }
  .souvenir.lifted { transform: translateY(-6px); opacity: 0; }
  img { position: absolute; left: 0; top: 0; width: ${width}px; height: ${height}px; display: block; border-radius: ${radii.map(radius => `${radius}px`).join(' ')}; }
  .flap { position: absolute; inset: 0; }
  .flap img { transform-origin: 0 0; }
  .sheen { position: absolute; inset: 0; background: rgba(255, 255, 255, .72); }
`

export function playLiftAnimation(el, imageUrl) {
  const rect = el.getBoundingClientRect()
  if (!isOnScreen(rect)) return Promise.resolve()

  const fit = fitInViewport(rect)
  const radii = [
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
  ].map(key => (parseFloat(getComputedStyle(el)[key]) || 0) * fit.scale)
  const { width, height } = fit

  const overlay = createOverlay({
    zIndex: 2147483646,
    css: styles(fit, radii),
    html: `<div class="souvenir"><img class="base" src="${imageUrl}"><div class="flap"><img src="${imageUrl}"><div class="sheen"></div></div></div>`,
  })
  const souvenir = overlay.root.querySelector('.souvenir')
  const base = overlay.root.querySelector('.base')
  const flap = overlay.root.querySelector('.flap')
  const flapImage = flap.querySelector('img')
  const maxFold = Math.min(MAX_FOLD, Math.min(width, height) * 0.16)

  const setFold = fold => {
    const folded = fold >= 0.5
    base.style.clipPath = folded
      ? `polygon(0 0, ${width}px 0, ${width}px ${height - fold}px, ${width - fold}px ${height}px, 0 ${height}px)`
      : 'none'
    flap.style.clipPath = folded
      ? `polygon(${width - fold}px ${height}px, ${width}px ${height - fold}px, ${width - fold}px ${height - fold}px)`
      : 'polygon(0 0, 0 0, 0 0)'
    const reflect = width + height - fold
    flapImage.style.transform = `matrix(0, -1, -1, 0, ${reflect}, ${reflect})`
  }
  setFold(0)

  return new Promise(resolve => {
    const start = performance.now()
    const step = now => {
      const progress = Math.min(1, (now - start) / FOLD_MS)
      setFold(maxFold * easeOut(progress))
      if (progress < 1) return requestAnimationFrame(step)
      setTimeout(() => {
        souvenir.classList.add('lifted')
        setTimeout(() => {
          overlay.remove()
          resolve()
        }, LIFT_MS)
      }, HOLD_MS)
    }
    requestAnimationFrame(step)
  })
}

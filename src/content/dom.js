export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const nextFrame = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

export function withTimeout(promise, ms, message) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export function describeElement(el) {
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : []
  return `${tag}${id}${classes
    .slice(0, 2)
    .map(name => `.${name}`)
    .join('')}`
}

export function readCornerRadii(el, width, height) {
  const style = getComputedStyle(el)
  const limit = Math.min(width, height) / 2
  const toPixels = value => {
    const [first] = value.split(' ')
    const amount = parseFloat(first) || 0
    return first.includes('%') ? (amount / 100) * Math.min(width, height) : amount
  }
  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map(value => Math.min(toPixels(value), limit))
}

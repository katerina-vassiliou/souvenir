import { describeElement } from './dom.js'
import { createOverlay } from './overlay.js'

const ACCENT = '#0d99ff'
const SWALLOWED_EVENTS = ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu']

const STYLES = `
  .box { position: fixed; box-sizing: border-box; border: 2px solid ${ACCENT}; background: rgba(13, 153, 255, .12); }
  .tag { position: fixed; padding: 4px 6px; border-radius: 4px; background: ${ACCENT}; color: #fff; white-space: nowrap; font: 600 11px/1 system-ui, sans-serif; }
  .hint { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); padding: 9px 14px; border-radius: 10px; background: rgba(24, 24, 27, .92); color: #fff; font: 500 12px/1.3 system-ui, sans-serif; }
  .hint b { color: #9fd4ff; }
`

const MARKUP = `
  <div class="box"></div>
  <div class="tag"></div>
  <div class="hint"><b>Click</b> to collect &nbsp; <b>↑ ↓</b> parent / child &nbsp; <b>Esc</b> cancel</div>
`

const swallow = event => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

export function pickElement(initial) {
  return new Promise(resolve => {
    const overlay = createOverlay({ zIndex: 2147483647, css: STYLES, html: MARKUP })
    const box = overlay.root.querySelector('.box')
    const tag = overlay.root.querySelector('.tag')
    let current = null
    box.style.display = tag.style.display = 'none'
    let children = []

    const highlight = el => {
      if (!el || el === document.documentElement) return
      box.style.display = tag.style.display = 'block'
      current = el
      const rect = el.getBoundingClientRect()
      Object.assign(box.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      })
      tag.textContent = `${describeElement(el)}  ${Math.round(rect.width)} × ${Math.round(rect.height)}`
      tag.style.left = `${Math.max(0, rect.left)}px`
      tag.style.top = `${rect.top > 26 ? rect.top - 24 : rect.top + 4}px`
    }

    const finish = result => {
      document.removeEventListener('mousemove', onMove, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition, true)
      for (const type of SWALLOWED_EVENTS) document.removeEventListener(type, swallow, true)
      overlay.remove()
      resolve(result)
    }

    const reposition = () => highlight(current)

    const onMove = event => {
      const under = document.elementFromPoint(event.clientX, event.clientY)
      if (under && under !== overlay.host && under !== current) {
        children = []
        highlight(under)
      }
    }

    const onClick = event => {
      swallow(event)
      finish(current)
    }

    const onKey = event => {
      const handled = ['Escape', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)
      if (handled) swallow(event)
      if (event.key === 'Escape') finish(null)
      else if (event.key === 'Enter') finish(current)
      else if (event.key === 'ArrowUp') {
        const parent = current?.parentElement
        if (parent && parent !== document.documentElement) {
          children.push(current)
          highlight(parent)
        }
      } else if (event.key === 'ArrowDown') {
        const child = children.pop()
        if (child) highlight(child)
      }
    }

    document.addEventListener('mousemove', onMove, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition, true)
    for (const type of SWALLOWED_EVENTS) document.addEventListener(type, swallow, true)

    highlight(initial)
  })
}

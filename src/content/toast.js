import { createOverlay } from './overlay.js'

const STYLES = `
  .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; padding: 9px 14px; border-radius: 8px; background: #18181b; color: #fff; font: 500 12px/1.3 system-ui, sans-serif; pointer-events: auto; animation: in .2s ease-out; }
  button { all: unset; cursor: pointer; font: 500 12px/1 system-ui, sans-serif; color: #fff; text-decoration: underline; text-underline-offset: 3px; opacity: .85; }
  button:hover { opacity: 1; }
  @keyframes in { from { opacity: 0; transform: translate(-50%, 8px); } }
`

export function showToast(message, actions = [], { lifetime = actions.length ? 5500 : 2200 } = {}) {
  const overlay = createOverlay({ zIndex: 2147483647, css: STYLES, html: '<div class="toast"></div>' })
  const toast = overlay.root.querySelector('.toast')
  let timer

  const close = () => {
    clearTimeout(timer)
    overlay.remove()
  }

  const update = (nextMessage, nextActions = [], ms = nextActions.length ? 5500 : 2200) => {
    const text = document.createElement('span')
    text.textContent = nextMessage
    toast.replaceChildren(text)
    for (const action of nextActions) {
      const button = document.createElement('button')
      button.textContent = action.label
      button.addEventListener('click', () => action.run({ update, close }))
      toast.append(button)
    }
    clearTimeout(timer)
    timer = setTimeout(close, ms)
  }

  update(message, actions, lifetime)
  return { update, close }
}

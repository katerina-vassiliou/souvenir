import { Message } from '../shared/messages.js'

const LOADED = Symbol.for('souvenir.content-script')

function start() {
  let lastContextTarget = null
  let pointer = null
  let busy = false

  document.addEventListener('contextmenu', event => (lastContextTarget = event.target), true)
  document.addEventListener('mousemove', event => (pointer = { x: event.clientX, y: event.clientY }), {
    capture: true,
    passive: true,
  })

  async function begin(source) {
    if (busy) return
    busy = true
    try {
      const [{ pickElement }, { collect }] = await Promise.all([
        import('./picker.js'),
        import('./collect.js'),
      ])
      const underPointer = pointer ? document.elementFromPoint(pointer.x, pointer.y) : null
      const element = await pickElement((source === 'menu' && lastContextTarget) || underPointer)
      if (element) await collect(element)
    } finally {
      busy = false
    }
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === Message.START) begin(message.source)
  })
}

if (!globalThis[LOADED]) {
  globalThis[LOADED] = true
  start()
}

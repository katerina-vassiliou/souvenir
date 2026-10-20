import { $ } from './dom.js'

const VISIBLE_MS = 1500
let timer

export function say(message) {
  const toast = $('toast')
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(timer)
  timer = setTimeout(() => toast.classList.remove('show'), VISIBLE_MS)
}

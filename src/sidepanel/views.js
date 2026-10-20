import { $ } from './dom.js'

const VIEWS = ['list', 'detail', 'settings', 'help']

export function showView(name) {
  for (const view of VIEWS) $(view).hidden = view !== name
  window.scrollTo(0, 0)
}

export const isShowing = name => !$(name).hidden

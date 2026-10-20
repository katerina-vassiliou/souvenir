const KEY = 'settings'

export const CaptureMethod = Object.freeze({
  AUTO: 'auto',
  RENDER: 'render',
  SCREENSHOT: 'screenshot',
})

export const DEFAULT_SETTINGS = Object.freeze({
  method: CaptureMethod.AUTO,
  background: 'transparent',
  padding: 0,
  autoKeep: false,
})

export const BACKGROUND_FILLS = Object.freeze({
  white: '#ffffff',
  dark: '#18181b',
})

export async function loadSettings() {
  const { [KEY]: saved = {} } = await chrome.storage.local.get(KEY)
  return { ...DEFAULT_SETTINGS, ...saved }
}

export function saveSettings(settings) {
  return chrome.storage.local.set({ [KEY]: settings })
}

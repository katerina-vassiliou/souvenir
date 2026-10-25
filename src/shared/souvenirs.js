const LIST_KEY = 'souvenirs'
const imageKey = id => `image:${id}`

export async function loadSouvenirs() {
  const { [LIST_KEY]: souvenirs = [] } = await chrome.storage.local.get(LIST_KEY)
  return souvenirs
}

export function saveSouvenirs(souvenirs) {
  return chrome.storage.local.set({ [LIST_KEY]: souvenirs })
}

// Messages between extension contexts are capped at 64 MB, so stay well under it.
export const MAX_IMAGE_BYTES = 40_000_000

const DATA_URL = /^data:image\/(png|webp);base64,/
const MAX_TEXT = 2000

const text = value => (typeof value === 'string' ? value.slice(0, MAX_TEXT) : '')
const size = value => (Number.isFinite(value) && value > 0 ? Math.round(value) : 0)

// The background worker stores whatever a content script sends, so check it here.
export function sanitizeSouvenir(input) {
  const { png, thumb, w, h, host, url, title, label } = input ?? {}
  if (typeof png !== 'string' || !DATA_URL.test(png)) throw new Error('Invalid souvenir image')
  if (typeof thumb !== 'string' || !DATA_URL.test(thumb)) throw new Error('Invalid souvenir thumbnail')
  if (png.length > MAX_IMAGE_BYTES) throw new Error('Souvenir image is too large')
  return {
    png,
    thumb,
    w: size(w),
    h: size(h),
    host: text(host),
    url: /^https?:\/\//.test(url) ? text(url) : '',
    title: text(title),
    label: text(label),
  }
}

export async function addSouvenir(input) {
  const { png, ...details } = sanitizeSouvenir(input)
  const id = crypto.randomUUID()
  const souvenirs = await loadSouvenirs()
  souvenirs.unshift({ ...details, id, at: Date.now() })
  await chrome.storage.local.set({ [LIST_KEY]: souvenirs, [imageKey(id)]: png })
}

export async function loadImage(id) {
  const { [imageKey(id)]: png } = await chrome.storage.local.get(imageKey(id))
  return png
}

export async function removeSouvenirs(ids) {
  const remaining = (await loadSouvenirs()).filter(souvenir => !ids.includes(souvenir.id))
  await chrome.storage.local.remove(ids.map(imageKey))
  await saveSouvenirs(remaining)
}

export async function clearSouvenirs() {
  await removeSouvenirs((await loadSouvenirs()).map(souvenir => souvenir.id))
}

export function onSouvenirsChange(listener) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[LIST_KEY]) listener(changes[LIST_KEY].newValue ?? [])
  })
}

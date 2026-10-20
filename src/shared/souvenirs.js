const LIST_KEY = 'souvenirs'
const imageKey = id => `image:${id}`

export async function loadSouvenirs() {
  const { [LIST_KEY]: souvenirs = [] } = await chrome.storage.local.get(LIST_KEY)
  return souvenirs
}

export function saveSouvenirs(souvenirs) {
  return chrome.storage.local.set({ [LIST_KEY]: souvenirs })
}

export async function addSouvenir({ png, ...details }) {
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

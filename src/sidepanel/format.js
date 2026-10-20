export function displayName(souvenir) {
  return souvenir.name || souvenir.title || souvenir.host || 'Untitled page'
}

export function formatAge(at, now = Date.now()) {
  const seconds = Math.max(1, Math.round((now - at) / 1000))
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`
  return `${Math.round(seconds / 86400)} d ago`
}

export function dataUrlBytes(dataUrl) {
  const payload = dataUrl.length - dataUrl.indexOf(',') - 1
  return Math.round((payload * 3) / 4)
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function matchesQuery(souvenir, query) {
  if (!query) return true
  const haystack = [souvenir.name, souvenir.title, souvenir.host, souvenir.label, souvenir.url]
  return haystack.some(value => (value ?? '').toLowerCase().includes(query.toLowerCase()))
}

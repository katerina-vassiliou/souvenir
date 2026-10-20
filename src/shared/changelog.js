export function parseChangelog(text) {
  const releases = []
  let current = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    const heading = /^##\s+(.+)$/.exec(line)
    if (heading) {
      current = /^\d/.test(heading[1]) ? { version: heading[1], intro: [], items: [] } : null
      if (current) releases.push(current)
    } else if (!current || !line || line.startsWith('#')) {
      continue
    } else if (line.startsWith('- ')) {
      current.items.push(line.slice(2).trim())
    } else {
      current.intro.push(line)
    }
  }
  return releases.map(({ version, intro, items }) => ({ version, intro: intro.join(' '), items }))
}

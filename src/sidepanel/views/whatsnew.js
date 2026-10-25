import { parseChangelog } from '../../shared/changelog.js'
import { $, element } from '../dom.js'

export async function renderWhatsNew() {
  const container = $('releases')
  try {
    const response = await fetch(chrome.runtime.getURL('CHANGELOG.md'))
    const releases = parseChangelog(await response.text())
    container.replaceChildren(
      ...releases.map(({ version, intro, items }) =>
        element('section', { className: 'release' }, [
          element('h3', { text: version }),
          ...(intro ? [element('p', { text: intro })] : []),
          ...(items.length
            ? [
                element(
                  'ul',
                  { className: 'tips' },
                  items.map(text => element('li', { text }))
                ),
              ]
            : []),
        ])
      )
    )
  } catch {
    container.replaceChildren(element('p', { className: 'lead', text: 'The changelog couldn’t be loaded.' }))
  }
}

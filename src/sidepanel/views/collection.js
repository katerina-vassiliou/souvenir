import { $, element } from '../dom.js'
import { displayName, formatAge, matchesQuery } from '../format.js'
import { ICONS } from '../icons.js'

function iconButton(kind, label, onClick) {
  const button = element('button', {
    className: 'icon',
    attrs: { type: 'button', 'aria-label': label, title: label },
  })
  button.innerHTML = ICONS[kind]
  button.addEventListener('click', event => {
    event.stopPropagation()
    onClick()
  })
  return button
}

function card(souvenir, actions, animate) {
  const image = element('img', {
    attrs: {
      src: souvenir.thumb,
      draggable: 'true',
      loading: 'lazy',
      decoding: 'async',
      alt: souvenir.label ? `${souvenir.label} from ${souvenir.host}` : 'Souvenir',
    },
  })
  const buttons = element('div', { className: 'actions' }, [
    iconButton('copy', 'Copy image', () => actions.copy(souvenir)),
    iconButton('palette', 'Copy palette', () => actions.palette(souvenir)),
    iconButton('trash', 'Remove', () => actions.remove(souvenir)),
  ])
  const tile = element(
    'div',
    {
      className: 'tile',
      attrs: {
        tabindex: '0',
        role: 'button',
        'aria-label': `Open souvenir from ${souvenir.host || 'a page'}`,
      },
    },
    [image, buttons]
  )
  tile.addEventListener('click', () => actions.open(souvenir))
  tile.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    actions.open(souvenir)
  })

  const meta = element('div', { className: 'meta' }, [
    element('b', { text: displayName(souvenir) }),
    element('span', {
      text: `${souvenir.host || 'Unknown site'} · ${souvenir.w} × ${souvenir.h} · ${formatAge(souvenir.at)}`,
    }),
  ])
  const root = element('article', { className: 'card' }, [tile, meta])
  if (!animate) root.style.animation = 'none'
  return root
}

export function renderCollection({ souvenirs, query, known, actions }) {
  const visible = souvenirs.filter(souvenir => matchesQuery(souvenir, query))
  $('collection').replaceChildren(
    ...visible.map(souvenir => card(souvenir, actions, !known.has(souvenir.id)))
  )
  $('none').hidden = !(souvenirs.length && !visible.length)
  $('empty').hidden = souvenirs.length > 0
  $('searchWrap').hidden = souvenirs.length === 0
  $('clear').hidden = souvenirs.length === 0
  $('layout').hidden = souvenirs.length === 0
  $('count').textContent = souvenirs.length
    ? `${souvenirs.length} souvenir${souvenirs.length === 1 ? '' : 's'}`
    : ''
}

export function setColumns(columns) {
  $('collection').style.setProperty('--cols', columns)
  for (const button of $('layout').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.cols === String(columns)))
  }
}

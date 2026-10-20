import { $, element } from '../dom.js'
import { loadImage } from '../../shared/souvenirs.js'
import { copyText, readPalette } from '../clipboard.js'
import { dataUrlBytes, formatBytes } from '../format.js'
import { ICONS } from '../icons.js'

function fact(label, value) {
  return [element('dt', { text: label }), element('dd', {}, [value])]
}

const text = value => document.createTextNode(value)

function addressLink(url) {
  const link = element('a', {
    text: url.replace(/^https?:\/\//, ''),
    attrs: { href: url, target: '_blank', rel: 'noreferrer' },
  })
  return link
}

function swatch({ hex }) {
  const button = element('button', {
    className: 'swatch',
    attrs: { type: 'button', title: `Copy ${hex}`, 'aria-label': `Copy ${hex}` },
  })
  button.style.setProperty('--swatch', hex)
  button.append(element('span', { text: hex }))
  button.addEventListener('click', () => copyText(hex, `Copied ${hex}`))
  return button
}

function fillPalette(souvenir) {
  $('copyPalette').innerHTML = ICONS.copy
  $('palette').hidden = true
  readPalette(souvenir)
    .then(colors => {
      if ($('big').dataset.id !== souvenir.id || !colors.length) return
      $('swatches').replaceChildren(...colors.map(swatch))
      $('palette').hidden = false
    })
    .catch(() => {})
}

export function fillDetail(souvenir) {
  const image = $('big')
  image.dataset.id = souvenir.id
  image.src = souvenir.thumb
  image.alt = souvenir.label ? `${souvenir.label} from ${souvenir.host}` : 'Souvenir'

  const name = $('name')
  name.value = souvenir.name || ''
  name.placeholder = souvenir.title || souvenir.host || 'Name this souvenir'

  const rows = [fact('Page', text(souvenir.title || souvenir.host || 'Untitled page'))]
  rows.push(
    souvenir.url ? fact('Address', addressLink(souvenir.url)) : fact('Site', text(souvenir.host || 'Unknown'))
  )
  if (souvenir.label) rows.push(fact('Element', element('code', { text: souvenir.label })))
  rows.push(fact('Size', text(`${souvenir.w} × ${souvenir.h} px`)))
  const imageSize = text('')
  rows.push(fact('Image', imageSize))
  rows.push(
    fact(
      'Collected',
      text(new Date(souvenir.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))
    )
  )
  $('facts').replaceChildren(...rows.flat())

  fillPalette(souvenir)

  loadImage(souvenir.id).then(png => {
    if (!png || $('big').dataset.id !== souvenir.id) return
    $('big').src = png
    imageSize.textContent = formatBytes(dataUrlBytes(png))
  })
}

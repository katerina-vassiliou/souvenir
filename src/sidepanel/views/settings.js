import { $ } from '../dom.js'
import { DEFAULT_SETTINGS } from '../../shared/settings.js'

const SEGMENTS = { methodSeg: 'method', bgSeg: 'background', padSeg: 'padding' }

export function paintSettings(settings) {
  $('autoKeep').setAttribute('aria-checked', String(settings.autoKeep))
  for (const [id, key] of Object.entries(SEGMENTS)) {
    for (const button of $(id).querySelectorAll('button')) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.v === String(settings[key] ?? DEFAULT_SETTINGS[key]))
      )
    }
  }
}

export function bindSettings(onChange) {
  $('autoKeep').addEventListener('click', () =>
    onChange({ autoKeep: $('autoKeep').getAttribute('aria-checked') !== 'true' })
  )
  for (const [id, key] of Object.entries(SEGMENTS)) {
    $(id).addEventListener('click', event => {
      const button = event.target.closest('button')
      if (!button) return
      onChange({ [key]: key === 'padding' ? Number(button.dataset.v) : button.dataset.v })
    })
  }
}

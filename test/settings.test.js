import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../src/shared/settings.js'

let stored

beforeEach(() => {
  stored = {}
  globalThis.chrome = {
    storage: {
      local: {
        get: async key => ({ [key]: stored[key] }),
        set: async values => Object.assign(stored, values),
      },
    },
  }
})

test('loadSettings returns the defaults when nothing is saved', async () => {
  assert.deepEqual(await loadSettings(), DEFAULT_SETTINGS)
})

test('loadSettings fills in anything missing from what was saved', async () => {
  stored.settings = { padding: 16 }
  assert.deepEqual(await loadSettings(), { ...DEFAULT_SETTINGS, padding: 16 })
})

test('saveSettings stores the settings', async () => {
  await saveSettings({ ...DEFAULT_SETTINGS, autoKeep: true })
  assert.equal(stored.settings.autoKeep, true)
})

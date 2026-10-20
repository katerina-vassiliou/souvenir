import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  addSouvenir,
  clearSouvenirs,
  loadImage,
  loadSouvenirs,
  removeSouvenirs,
} from '../src/shared/souvenirs.js'

let stored

beforeEach(() => {
  stored = {}
  globalThis.chrome = {
    storage: {
      local: {
        get: async key => ({ [key]: stored[key] }),
        set: async values => Object.assign(stored, values),
        remove: async keys => keys.forEach(key => delete stored[key]),
      },
    },
  }
})

test('addSouvenir keeps the list small and the full image under its own key', async () => {
  await addSouvenir({ png: 'data:image/png;base64,AAAA', thumb: 'thumb', host: 'a.com' })
  const [souvenir] = await loadSouvenirs()
  assert.equal(souvenir.thumb, 'thumb')
  assert.equal('png' in souvenir, false)
  assert.equal(await loadImage(souvenir.id), 'data:image/png;base64,AAAA')
})

test('newest souvenirs come first', async () => {
  await addSouvenir({ png: 'one', thumb: 'one', host: 'one.com' })
  await addSouvenir({ png: 'two', thumb: 'two', host: 'two.com' })
  assert.deepEqual(
    (await loadSouvenirs()).map(souvenir => souvenir.host),
    ['two.com', 'one.com']
  )
})

test('removeSouvenirs deletes the entry and its image', async () => {
  await addSouvenir({ png: 'one', thumb: 'one', host: 'one.com' })
  await addSouvenir({ png: 'two', thumb: 'two', host: 'two.com' })
  const [newest, oldest] = await loadSouvenirs()
  await removeSouvenirs([oldest.id])
  assert.deepEqual(
    (await loadSouvenirs()).map(souvenir => souvenir.id),
    [newest.id]
  )
  assert.equal(await loadImage(oldest.id), undefined)
})

test('clearSouvenirs empties the collection and its images', async () => {
  await addSouvenir({ png: 'one', thumb: 'one', host: 'one.com' })
  await clearSouvenirs()
  assert.deepEqual(await loadSouvenirs(), [])
  assert.deepEqual(
    Object.keys(stored).filter(key => key.startsWith('image:')),
    []
  )
})

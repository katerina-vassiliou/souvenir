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
  await addSouvenir({
    png: 'data:image/png;base64,AAAA',
    thumb: 'data:image/webp;base64,THUMB',
    host: 'a.com',
  })
  const [souvenir] = await loadSouvenirs()
  assert.equal(souvenir.thumb, 'data:image/webp;base64,THUMB')
  assert.equal('png' in souvenir, false)
  assert.equal(await loadImage(souvenir.id), 'data:image/png;base64,AAAA')
})

test('newest souvenirs come first', async () => {
  await addSouvenir({
    png: 'data:image/png;base64,ONE',
    thumb: 'data:image/webp;base64,ONE',
    host: 'one.com',
  })
  await addSouvenir({
    png: 'data:image/png;base64,TWO',
    thumb: 'data:image/webp;base64,TWO',
    host: 'two.com',
  })
  assert.deepEqual(
    (await loadSouvenirs()).map(souvenir => souvenir.host),
    ['two.com', 'one.com']
  )
})

test('removeSouvenirs deletes the entry and its image', async () => {
  await addSouvenir({
    png: 'data:image/png;base64,ONE',
    thumb: 'data:image/webp;base64,ONE',
    host: 'one.com',
  })
  await addSouvenir({
    png: 'data:image/png;base64,TWO',
    thumb: 'data:image/webp;base64,TWO',
    host: 'two.com',
  })
  const [newest, oldest] = await loadSouvenirs()
  await removeSouvenirs([oldest.id])
  assert.deepEqual(
    (await loadSouvenirs()).map(souvenir => souvenir.id),
    [newest.id]
  )
  assert.equal(await loadImage(oldest.id), undefined)
})

test('clearSouvenirs empties the collection and its images', async () => {
  await addSouvenir({
    png: 'data:image/png;base64,ONE',
    thumb: 'data:image/webp;base64,ONE',
    host: 'one.com',
  })
  await clearSouvenirs()
  assert.deepEqual(await loadSouvenirs(), [])
  assert.deepEqual(
    Object.keys(stored).filter(key => key.startsWith('image:')),
    []
  )
})

test('addSouvenir rejects images that are not PNG or WebP data URLs', async () => {
  const thumb = 'data:image/webp;base64,AAAA'
  await assert.rejects(addSouvenir({ png: 'https://evil.test/x.png', thumb }), /Invalid souvenir image/)
  await assert.rejects(addSouvenir({ png: 'data:text/html;base64,AAAA', thumb }), /Invalid souvenir image/)
  await assert.rejects(addSouvenir({ png: 'data:image/png;base64,AAAA', thumb: 'x' }), /thumbnail/)
  assert.deepEqual(await loadSouvenirs(), [])
})

test('addSouvenir keeps only known fields and safe values', async () => {
  await addSouvenir({
    png: 'data:image/png;base64,AAAA',
    thumb: 'data:image/webp;base64,AAAA',
    w: -4,
    h: 20.4,
    host: 'a.com',
    url: 'javascript:alert(1)',
    extra: 'dropped',
  })
  const [souvenir] = await loadSouvenirs()
  assert.equal(souvenir.url, '')
  assert.equal(souvenir.w, 0)
  assert.equal(souvenir.h, 20)
  assert.equal('extra' in souvenir, false)
})

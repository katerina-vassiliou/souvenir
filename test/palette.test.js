import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractPalette, paletteJson, toHex } from '../src/shared/palette.js'

const fill = (count, [r, g, b, a = 255]) => Array.from({ length: count }, () => [r, g, b, a]).flat()

test('toHex pads and rounds channels', () => {
  assert.equal(toHex([0, 15.4, 255]), '#000fff')
})

test('a single flat colour gives one swatch', () => {
  const palette = extractPalette(Uint8ClampedArray.from(fill(50, [255, 0, 0])))
  assert.deepEqual(palette, [{ hex: '#ff0000', rgb: [255, 0, 0], share: 1 }])
})

test('colours are ordered by how much of the image they cover', () => {
  const pixels = Uint8ClampedArray.from([...fill(30, [0, 0, 255]), ...fill(70, [250, 250, 250])])
  const palette = extractPalette(pixels)
  assert.equal(palette[0].hex, '#fafafa')
  assert.equal(palette[0].share, 0.7)
  assert.equal(palette[1].hex, '#0000ff')
})

test('transparent pixels are ignored', () => {
  const pixels = Uint8ClampedArray.from([...fill(90, [0, 0, 0, 0]), ...fill(10, [0, 128, 0])])
  assert.deepEqual(
    extractPalette(pixels).map(color => color.hex),
    ['#008000']
  )
})

test('a fully transparent image has no palette', () => {
  assert.deepEqual(extractPalette(Uint8ClampedArray.from(fill(10, [1, 2, 3, 0]))), [])
})

test('near-identical shades merge into one swatch', () => {
  const pixels = Uint8ClampedArray.from([...fill(20, [100, 100, 100]), ...fill(20, [106, 100, 100])])
  assert.equal(extractPalette(pixels).length, 1)
})

test('a small accent colour still makes the palette', () => {
  const pixels = Uint8ClampedArray.from([...fill(990, [250, 250, 250]), ...fill(10, [200, 30, 30])])
  assert.deepEqual(
    extractPalette(pixels).map(color => color.hex),
    ['#fafafa', '#c81e1e']
  )
})

test('the palette never exceeds the requested size', () => {
  const pixels = []
  for (let i = 0; i < 12; i++) pixels.push(...fill(10, [i * 20, 255 - i * 20, (i * 70) % 255]))
  assert.ok(extractPalette(Uint8ClampedArray.from(pixels), 4).length <= 4)
})

test('paletteJson names the palette and lists the colours', () => {
  const colors = [{ hex: '#000000', rgb: [0, 0, 0], share: 1 }]
  assert.deepEqual(JSON.parse(paletteJson('Hero', colors)), { name: 'Hero', colors })
})

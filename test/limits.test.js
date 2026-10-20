import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fitPixelRatio } from '../src/content/capture/limits.js'

test('keeps the wanted pixel ratio for ordinary elements', () => {
  assert.equal(fitPixelRatio(500, 500, 2), 2)
})

test('lowers the ratio so a very tall element still fits in a canvas', () => {
  const ratio = fitPixelRatio(500, 20_000, 2)
  assert.ok(ratio < 1)
  assert.ok(20_000 * ratio <= 16_000)
})

test('lowers the ratio for a very large area', () => {
  const ratio = fitPixelRatio(12_000, 12_000, 2)
  assert.ok(12_000 * 12_000 * ratio * ratio <= 240_000_000)
})

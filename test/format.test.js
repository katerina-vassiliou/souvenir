import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dataUrlBytes, displayName, formatAge, formatBytes, matchesQuery } from '../src/sidepanel/format.js'

test('displayName prefers the name, then the title, then the site', () => {
  assert.equal(displayName({ name: 'Hero', title: 'Page', host: 'a.com' }), 'Hero')
  assert.equal(displayName({ title: 'Page', host: 'a.com' }), 'Page')
  assert.equal(displayName({ host: 'a.com' }), 'a.com')
  assert.equal(displayName({}), 'Untitled page')
})

test('formatAge describes how long ago something happened', () => {
  const now = 1_000_000_000
  assert.equal(formatAge(now - 5_000, now), 'just now')
  assert.equal(formatAge(now - 5 * 60_000, now), '5 min ago')
  assert.equal(formatAge(now - 3 * 3_600_000, now), '3 h ago')
  assert.equal(formatAge(now - 2 * 86_400_000, now), '2 d ago')
})

test('formatBytes uses KB below a megabyte and MB above', () => {
  assert.equal(formatBytes(10), '1 KB')
  assert.equal(formatBytes(2048), '2 KB')
  assert.equal(formatBytes(3 * 1024 * 1024), '3.0 MB')
})

test('dataUrlBytes estimates the decoded size of a base64 data URL', () => {
  assert.equal(dataUrlBytes('data:image/png;base64,AAAA'), 3)
})

test('matchesQuery searches name, title, site, element and address without regard to case', () => {
  const souvenir = {
    name: 'Hero banner',
    host: 'example.com',
    label: 'header.hero',
    url: 'https://example.com/a',
  }
  assert.equal(matchesQuery(souvenir, ''), true)
  assert.equal(matchesQuery(souvenir, 'HERO'), true)
  assert.equal(matchesQuery(souvenir, 'example'), true)
  assert.equal(matchesQuery(souvenir, 'header.hero'), true)
  assert.equal(matchesQuery(souvenir, 'missing'), false)
})

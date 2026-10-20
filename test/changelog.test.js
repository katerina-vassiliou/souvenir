import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseChangelog } from '../src/shared/changelog.js'

test('parseChangelog reads versions, intros and bullets, newest first', () => {
  const releases = parseChangelog(
    [
      '# Changelog',
      '',
      '## 1.1.1',
      '',
      '- One.',
      '- Two.',
      '',
      '## 1.1.0',
      '',
      'First release.',
      '',
      '- Three.',
    ].join('\n')
  )
  assert.deepEqual(releases, [
    { version: '1.1.1', intro: '', items: ['One.', 'Two.'] },
    { version: '1.1.0', intro: 'First release.', items: ['Three.'] },
  ])
})

test('parseChangelog skips sections that are not released versions', () => {
  const releases = parseChangelog(['## Unreleased', '', '- Later.', '', '## 1.0.0', '', '- Now.'].join('\n'))
  assert.deepEqual(releases, [{ version: '1.0.0', intro: '', items: ['Now.'] }])
})

test('the changelog in the repository starts with the version in the manifest', () => {
  const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'))
  const [latest] = parseChangelog(readFileSync('CHANGELOG.md', 'utf8'))
  assert.equal(latest.version, version)
})

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const firefox = process.argv.includes('--firefox')
const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'))
const output = resolve(`dist/souvenir-${version}${firefox ? '-firefox' : ''}.zip`)
const files = ['src', 'vendor', 'icons', 'LICENSE']

mkdirSync('dist', { recursive: true })
rmSync(output, { force: true })

const staging = mkdtempSync(join(tmpdir(), 'souvenir-'))
copyFileSync(firefox ? 'manifest.firefox.json' : 'manifest.json', join(staging, 'manifest.json'))
for (const file of files) cpSync(file, join(staging, file), { recursive: true })
execFileSync('zip', ['-r', '-q', output, 'manifest.json', ...files, '-x', '*.DS_Store'], {
  cwd: staging,
  stdio: 'inherit',
})
rmSync(staging, { recursive: true, force: true })
console.log(`Created ${output}`)

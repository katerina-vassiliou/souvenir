import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'))
const output = `dist/souvenir-${version}.zip`

mkdirSync('dist', { recursive: true })
rmSync(output, { force: true })
execFileSync(
  'zip',
  ['-r', '-q', output, 'manifest.json', 'src', 'vendor', 'icons', 'LICENSE', '-x', '*.DS_Store'],
  { stdio: 'inherit' }
)
console.log(`Created ${output}`)

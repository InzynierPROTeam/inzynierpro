import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = fileURLToPath(new URL('../../../..', import.meta.url))

it.each(['runtime', 'type-only'])('detects %s cycles through the built-in import plugin', mode => {
  const directory = mkdtempSync(join(here, 'cycle-probe-'))

  try {
    const source =
      mode === 'runtime'
        ? [
            'export { b } from "./b.js"\nexport const a = 1\n',
            'export { a } from "./a.js"\nexport const b = 2\n',
          ]
        : [
            'import type { B } from "./b.js"\n\nexport type A = { next: B }\n',
            'import type { A } from "./a.js"\n\nexport type B = { next: A }\n',
          ]

    writeFileSync(join(directory, 'a.ts'), source[0] ?? '')
    writeFileSync(join(directory, 'b.ts'), source[1] ?? '')

    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'effect-tsgo',
        'oxlint',
        '--config',
        join(root, '.oxlintrc.json'),
        '--format',
        'json',
        directory,
      ],
      { cwd: root, encoding: 'utf8', timeout: 15_000 },
    )

    assert.ifError(result.error)
    const output = `${result.stdout}\n${result.stderr}`

    expect(result.status, output).toBeGreaterThan(0)
    expect(output).toContain('no-cycle')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

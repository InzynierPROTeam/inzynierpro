import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { test } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../../..')

function lintProbe(source: string) {
  const directory = mkdtempSync(join(here, 'lint-probe-'))
  const file = join(directory, 'probe.ts')

  try {
    writeFileSync(file, source)

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
        file,
      ],
      { cwd: root, encoding: 'utf8' },
    )

    assert.ifError(result.error)
    assert.equal(readFileSync(file, 'utf8'), source, 'Lint must not modify the source')

    return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('CLI loads the project and Anti-slop rules', () => {
  const result = lintProbe(`import { join } from 'node:path'
export const value = join('a', 'b')
import { basename } from 'node:path'
export function label(flag: boolean) {
  const text = basename(value)
  if (flag) {
    console.log(text)
  }
  return text
}
export const labels = [1, 2].filter(Boolean).map(String)
`)

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /blank-line-before-return/)
  assert.match(result.output, /blank-lines-around-control-flow/)
  assert.match(result.output, /imports-first/)
  assert.match(result.output, /blank-line-after-imports/)
  assert.match(result.output, /no-array-filter-map/)
})

test('CLI enables the separate Effect syntax rules', () => {
  const result = lintProbe(`export const result = { _tag: 'Ready', value: 1 }

export const isReady = result._tag === 'Ready'
`)

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /no-manual-tagged-construction/)
  assert.match(result.output, /no-manual-tag-comparison/)
})

test('CLI rejects floating Effects using type-aware Effect diagnostics', () => {
  const result = lintProbe(`import { Effect } from 'effect'

Effect.log('not executed')
`)

  assert.equal(result.status, 1, result.output)
  assert.match(result.output, /floating-effect/)
})

test('CLI accepts a consumed Effect and a lazy iterator pipeline', () => {
  const result = lintProbe(`import { Effect } from 'effect'

export const program = Effect.log('consumed')

export const labels = [1, 2].values().filter(Boolean).map(String).toArray()
`)

  assert.equal(result.status, 0, result.output)
})

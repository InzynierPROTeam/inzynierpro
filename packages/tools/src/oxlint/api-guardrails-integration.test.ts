import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = fileURLToPath(new URL('../../../..', import.meta.url))

const probes = [
  {
    name: 'current API usage',
    source: 'import { current } from "./api.js"\n\nexport const value = current()\n',
    rule: null,
  },
  {
    name: 'deprecated API usage',
    source: 'import { legacy } from "./api.js"\n\nexport const value = legacy()\n',
    rule: 'no-deprecated',
  },
  {
    name: 'named re-exports',
    source: 'export { current } from "./api.js"\n',
    rule: 'no-reexports',
  },
  {
    name: 'imported bindings exported indirectly',
    source: 'import { current } from "./api.js"\n\nexport { current }\n',
    rule: 'no-reexports',
  },
]

it('enforces deprecated API and re-export guards through the configured lint command', () => {
  const directory = mkdtempSync(join(here, 'guardrail-probe-'))

  try {
    writeFileSync(
      join(directory, 'api.ts'),
      '/** @deprecated Use current instead. */\nexport function legacy() { return 1 }\n\nexport function current() { return 1 }\n',
    )

    const consumers = probes.map((probe, index) => {
      const filename = join(directory, `consumer-${index}.ts`)
      writeFileSync(filename, probe.source)

      return { filename, rule: probe.rule }
    })

    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'effect-tsgo',
        'oxlint',
        '--type-aware',
        '--config',
        join(root, '.oxlintrc.json'),
        ...consumers.map(consumer => consumer.filename),
      ],
      { cwd: root, encoding: 'utf8', timeout: 15_000 },
    )

    expect(result.error).toBeUndefined()
    const output = `${result.stdout}\n${result.stderr}`
    expect(result.status, output).toBe(1)

    for (const { filename, rule } of consumers) {
      const diagnostics = output
        .split('\n')
        .filter(line => line.includes(`${relative(root, filename)}:`))

      if (rule === null) {
        expect(diagnostics, output).toEqual([])
      } else {
        expect(
          diagnostics.some(line => line.includes(rule)),
          output,
        ).toBe(true)
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

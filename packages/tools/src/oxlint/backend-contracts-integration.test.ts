import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../../..', import.meta.url))

it('loads backend and contract guards through the repository Oxlint configuration', () => {
  const name = `guardrail-probe-${randomUUID()}`

  const probes = [
    {
      path: `apps/api/src/modules/${name}/documents.query.ts`,
      code: 'export const rows = sql`SELECT id FROM users`',
      rule: 'backend-boundaries',
    },
    {
      path: `packages/api-client/src/modules/${name}.ts`,
      code: "import { apiAction } from '~api-client/lib/api-action.js'; export const check = apiAction(api => api.HealthCheck.CheckHealth())",
      rule: 'api-client-contracts',
    },
    {
      path: `packages/api-contracts/src/modules/${name}/api.ts`,
      code: "import { HttpApiEndpoint } from 'effect/http-api'; const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Schema.Struct({ id: Uuid }) })",
      rule: 'request-schemas',
    },
    {
      path: `packages/domain/src/modules/${name}/answer.ts`,
      code: "export const AnswerId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand('AnswerId'))",
      rule: 'domain-identifiers',
    },
  ]

  try {
    for (const probe of probes) {
      const file = join(root, probe.path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, probe.code)
    }

    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'effect-tsgo',
        'oxlint',
        '--config',
        join(root, '.oxlintrc.json'),
        ...probes.map(probe => probe.path),
      ],
      { cwd: root, encoding: 'utf8', timeout: 15_000 },
    )

    const output = `${result.stdout}\n${result.stderr}`

    expect(result.error).toBeUndefined()
    expect(result.status, output).toBe(1)

    for (const probe of probes) {
      expect(
        output.split('\n').some(line => line.includes(probe.path) && line.includes(probe.rule)),
        output,
      ).toBe(true)
    }
  } finally {
    for (const probe of probes) {
      const file = join(root, probe.path)

      if (file.endsWith(`${name}.ts`)) {
        rmSync(file, { force: true })
      } else {
        rmSync(dirname(file), { recursive: true, force: true })
      }
    }
  }
})

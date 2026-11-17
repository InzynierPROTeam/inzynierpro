import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, expect, test } from 'vitest'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'inzpro-lint-')))
const name = `lint-probe-${randomUUID()}`
const local = `packages/tools/src/oxlint/${name}`

const featurePath = `apps/platform/src/features/${name.replaceAll('-', '')}`
const moduleCommand = `apps/api/src/modules/preparation/application/${name}.command.ts`

type Probe = {
  readonly path: string
  readonly code: string
  readonly rules: ReadonlyArray<string>
}

const probes: ReadonlyArray<Probe> = [
  {
    path: `${featurePath}/utils.ts`,
    code: 'export const value = 1\n',
    rules: ['file-roles'],
  },
  {
    path: `${featurePath}/utils/quiz/settings.ts`,
    code: 'export const value = 1\n',
    rules: ['file-roles'],
  },
  {
    path: `${featurePath}/components/quiz/QuizPage.tsx`,
    code: 'export const value = 1\n',
    rules: ['file-roles'],
  },
  {
    path: `${featurePath}/hooks/quiz/useNestedProbe.ts`,
    code: 'export const useNestedProbe = () => 1\n',
    rules: [],
  },
  {
    path: `packages/api-contracts/src/modules/${name}/endpoints/nested.ts`,
    code: "import { HttpApiEndpoint } from 'effect/http-api'; const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Schema.Struct({ id: Uuid }) })",
    rules: ['request-schemas'],
  },
  {
    path: `packages/queries/src/modules/${name}/queries/quiz/checks.ts`,
    code: "import { effectInfiniteQueryOptions } from '~queries/lib/effect-query-options.js'; export const pathsQueryOptions = () => effectInfiniteQueryOptions(keys.paths(), Effect.succeed(1).pipe(Effect.as(2)))",
    rules: ['infinite-query-names', 'queries-wrap-actions'],
  },
  {
    path: `packages/domain/src/modules/${name}/quiz/check.ts`,
    code: "import { Schema } from 'effect'; export const Question = Schema.Struct({ count: Schema.Int })",
    rules: ['domain-vocabulary'],
  },

  {
    path: `${local}/comment-narration.ts`,
    code: '// The question card explains a missing session.\nexport const value = 1\n',
    rules: ['comment-policy'],
  },
  {
    path: `${local}/comment-fixture.ts`,
    code: 'export const value = "// The question card explains a missing session."\n',
    rules: [],
  },
  {
    path: `${local}/anti-slop.ts`,
    code: `import { join } from 'node:path'
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
`,
    rules: ['require-readable-spacing', 'first', 'no-array-filter-map'],
  },
  {
    path: `${local}/effect-syntax.ts`,
    code: `export const result = { _tag: 'Ready', value: 1 }

export const isReady = result._tag === 'Ready'
`,
    rules: ['no-manual-tagged-construction', 'no-manual-tag-comparison'],
  },
  {
    path: `${local}/floating-effect.ts`,
    code: `import { Effect } from 'effect'

Effect.log('not executed')
`,
    rules: ['floating-effect'],
  },
  {
    path: `${local}/clean.ts`,
    code: `import { Effect } from 'effect'

export const program = Effect.log('consumed')

export const labels = [1, 2].values().filter(Boolean).map(String).toArray()
`,
    rules: [],
  },
  {
    path: `${local}/runtime-cycle/a.ts`,
    code: 'export { b } from "./b.js"\nexport const a = 1\n',
    rules: ['no-cycle'],
  },
  {
    path: `${local}/runtime-cycle/b.ts`,
    code: 'export { a } from "./a.js"\nexport const b = 2\n',
    rules: ['no-cycle'],
  },
  {
    path: `${local}/type-cycle/a.ts`,
    code: 'import type { B } from "./b.js"\n\nexport type A = { next: B }\n',
    rules: ['no-cycle'],
  },
  {
    path: `${local}/type-cycle/b.ts`,
    code: 'import type { A } from "./a.js"\n\nexport type B = { next: A }\n',
    rules: ['no-cycle'],
  },
  {
    path: `${local}/guards/current.ts`,
    code: 'import { current } from "./api.js"\n\nexport const value = current()\n',
    rules: [],
  },
  {
    path: `${local}/guards/deprecated.ts`,
    code: 'import { legacy } from "./api.js"\n\nexport const value = legacy()\n',
    rules: ['no-deprecated'],
  },
  {
    path: `${local}/guards/reexport.ts`,
    code: 'export { current } from "./api.js"\n',
    rules: ['no-reexports'],
  },
  {
    path: `${local}/guards/indirect-reexport.ts`,
    code: 'import { current } from "./api.js"\n\nexport { current }\n',
    rules: ['no-reexports'],
  },
  {
    path: `apps/api/src/modules/${name}/documents.query.ts`,
    code: 'export const rows = sql`SELECT id FROM users`',
    rules: ['backend-boundaries'],
  },
  {
    path: `packages/api-client/src/modules/${name}/sessions.ts`,
    code: "import { apiAction } from '~api-client/lib/api-action.js'; export const check = apiAction(api => api.HealthCheck.CheckHealth())",
    rules: ['api-client-contracts'],
  },
  {
    path: `packages/api-contracts/src/modules/${name}/api.ts`,
    code: "import { HttpApiEndpoint } from 'effect/http-api'; const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Schema.Struct({ id: Uuid }) })",
    rules: ['request-schemas'],
  },
  {
    path: `packages/api-contracts/src/modules/${name}/oral-api.ts`,
    code: "import { HttpApiEndpoint } from 'effect/http-api'; const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Schema.Struct({ id: Uuid }) })",
    rules: ['file-roles', 'request-schemas'],
  },
  {
    path: `packages/api-contracts/src/modules/${name}/nested/api.ts`,
    code: 'export const value = 1\n',
    rules: ['file-roles'],
  },
  {
    path: `packages/api-client/src/modules/${name}/sessions.test.ts`,
    code: 'export const value = 1\n',
    rules: [],
  },
  {
    path: `packages/queries/src/modules/${name}/queries/sessions.ts`,
    code: "import { effectInfiniteQueryOptions } from '~queries/lib/effect-query-options.js'; export const pathsQueryOptions = () => effectInfiniteQueryOptions(keys.paths(), Effect.succeed(1).pipe(Effect.as(2)))",
    rules: ['infinite-query-names', 'queries-wrap-actions'],
  },
  {
    path: `packages/queries/src/modules/${name}/keys.ts`,
    code: 'export const probeKeys = { all: ["probe"] as const }\n',
    rules: [],
  },
  {
    path: `packages/domain/src/modules/${name}/answer.ts`,
    code: "export const AnswerId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand('AnswerId'))",
    rules: ['domain-identifiers'],
  },
  {
    path: `${local}/camelCase.ts`,
    code: 'export const value = 1\n',
    rules: ['filename-case'],
  },
  {
    path: `${local}/Naming/value.ts`,
    code: 'export const value = 1\n',
    rules: ['directory-names'],
  },
  {
    path: `${featurePath}/components/ProbeCard.tsx`,
    code: 'export const value = 1\n',
    rules: [],
  },
  {
    path: `${featurePath}/components/VerifyOTPProbe.tsx`,
    code: 'export const value = 1\n',
    rules: [],
  },
  {
    path: `${featurePath}/components/probe-card.tsx`,
    code: 'export const value = 1\n',
    rules: ['filename-case'],
  },
  {
    path: `${featurePath}/hooks/useProbe.ts`,
    code: 'export const useProbe = () => 1\n',
    rules: [],
  },
  {
    path: moduleCommand,
    code: "import { StudyReader } from '~api/modules/written-study/application/study.reader.js'\n\nexport const reader = StudyReader\n",
    rules: ['module-layers'],
  },
]

const deprecatedApi = {
  path: `${local}/guards/api.ts`,
  code: '/** @deprecated Use current instead. */\nexport function legacy() { return 1 }\n\nexport function current() { return 1 }\n',
}

type Report = {
  readonly diagnostics: ReadonlyArray<{ readonly code: string; readonly filename: string }>
}

const reported = new Map<string, Array<string>>()

beforeAll(() => {
  symlinkSync(join(root, 'node_modules'), join(scratch, 'node_modules'), 'dir')
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module' }))

  const config = readFileSync(join(root, '.oxlintrc.json'), 'utf8')
    .replaceAll('"./node_modules/', `"${root}node_modules/`)
    .replaceAll('"./packages/tools/', `"${root}packages/tools/`)

  writeFileSync(join(scratch, '.oxlintrc.json'), config)

  for (const workspace of [
    'packages/tools',
    'packages/api-client',
    'packages/api-contracts',
    'packages/queries',
    'packages/domain',
    'apps/platform',
    'apps/api',
  ]) {
    mkdirSync(join(scratch, workspace), { recursive: true })
    writeFileSync(
      join(scratch, workspace, 'package.json'),
      JSON.stringify({ name: `@inzpro/${workspace.split('/').at(-1)}`, type: 'module' }),
    )
  }

  writeFileSync(
    join(scratch, 'tsconfig.json'),
    JSON.stringify({
      extends: join(root, 'packages/tools/tsconfig/effect.json'),
      compilerOptions: {
        target: 'ESNext',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        jsx: 'react-jsx',
        lib: ['ESNext', 'DOM'],
        types: ['node'],
        paths: {
          '~tools/*': ['./packages/tools/src/*'],
          '~api-client/*': ['./packages/api-client/src/*'],
          '~api-contracts/*': ['./packages/api-contracts/src/*'],
          '~queries/*': ['./packages/queries/src/*'],
          '~domain/*': ['./packages/domain/src/*'],
          '~api/*': ['./apps/api/src/*'],
          '~platform/*': ['./apps/platform/src/*'],
        },
      },
      include: ['apps/**/*.ts', 'apps/**/*.tsx', 'packages/**/*.ts', 'packages/**/*.tsx'],
    }),
  )

  for (const file of [...probes, deprecatedApi]) {
    mkdirSync(dirname(join(scratch, file.path)), { recursive: true })
    writeFileSync(join(scratch, file.path), file.code)
  }

  const result = spawnSync(
    join(root, 'node_modules/.bin/effect-tsgo'),
    [
      'oxlint',
      '--type-aware',
      '--config',
      join(scratch, '.oxlintrc.json'),
      '--format',
      'json',
      ...probes.map(probe => probe.path),
    ],
    { cwd: scratch, encoding: 'utf8', timeout: 30_000 },
  )

  if (result.error !== undefined) {
    throw result.error
  }

  // SAFETY: oxlint's JSON formatter prints one object with a diagnostics array.
  const report = JSON.parse(result.stdout) as Report

  for (const { code, filename } of report.diagnostics) {
    reported.set(filename, [...(reported.get(filename) ?? []), code])
  }
}, 60_000)

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true })
})

test.each(probes.map(probe => [probe.path.replace(name, 'probe'), probe] as const))(
  '%s',
  (_, probe) => {
    const codes = reported.get(probe.path) ?? []

    if (probe.rules.length === 0) {
      expect(codes).toEqual([])
    }

    for (const rule of probe.rules) {
      expect(
        codes.some(code => code.includes(`(${rule})`)),
        codes.join('\n'),
      ).toBe(true)
    }

    expect(readFileSync(join(scratch, probe.path), 'utf8'), 'Lint must not modify the source').toBe(
      probe.code,
    )
  },
)

test('discovers untracked role violations when linting a directory', () => {
  const result = spawnSync(
    join(root, 'node_modules/.bin/effect-tsgo'),
    [
      'oxlint',
      '--config',
      join(scratch, '.oxlintrc.json'),
      '--format',
      'json',
      `packages/api-contracts/src/modules/${name}`,
    ],
    { cwd: scratch, encoding: 'utf8', timeout: 30_000 },
  )

  expect(result.error).toBeUndefined()
  expect(result.status).toBe(1)
  expect(result.stdout).toContain('oral-api.ts')
  expect(result.stdout).toContain('(file-roles)')
})

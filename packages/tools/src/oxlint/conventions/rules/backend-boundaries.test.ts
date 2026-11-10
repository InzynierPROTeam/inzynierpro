import { RuleTester } from 'oxlint/plugins-dev'

import { backendBoundariesRule } from './backend-boundaries.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const file = (name: string) => `/repo/apps/api/src/${name}`
const sql = 'const rows = sql`SELECT id FROM users`'

tester.run('conventions/backend-boundaries', backendBoundariesRule, {
  valid: [
    {
      filename: file('modules/study/study.reader.postgres.ts'),
      code: `import { SqlClient } from 'effect/sql'; ${sql}`,
    },
    { filename: file('modules/study/study.repository.postgres.ts'), code: sql },
    { filename: file('migrations/0001_identity.ts'), code: sql },
    { filename: file('seed/catalogue.ts'), code: sql },
    { filename: file('modules/study/http.ts'), code: 'const value = "SELECT id FROM users"' },
    {
      filename: file('modules/study/preview.query.ts'),
      code: 'const studyReader = yield* StudyReader',
    },
    {
      filename: file('modules/study/http.test.ts'),
      code: 'const result = yield* studyRepository.record(input)',
    },
    {
      filename: file('modules/study/errors.ts'),
      code: "import type { SqlError } from 'effect/sql'",
    },
    { filename: '/repo/packages/db/src/client.ts', code: "import { SqlClient } from 'effect/sql'" },
  ],
  invalid: [
    {
      filename: file('modules/study/transport.ts'),
      code: "import { HttpApiBuilder as Http } from 'effect/http-api'; const group = Http.group(Api, 'Study', handlers)",
      errors: [{ messageId: 'filename' }],
    },
    {
      filename: file('modules/study/documents.query.ts'),
      code: sql,
      errors: [{ messageId: 'sql' }],
    },
    { filename: file('test/fixtures.ts'), code: sql, errors: [{ messageId: 'sql' }] },
    {
      filename: file('modules/study/http.test.ts'),
      code: "import { SqlClient as Database } from 'effect/sql'",
      errors: [{ messageId: 'sql' }],
    },
    {
      filename: file('modules/study/http.ts'),
      code: "import * as SQL from 'effect/sql'",
      errors: [{ messageId: 'sql' }],
    },
    {
      filename: file('modules/study/access.policy.ts'),
      code: "import * as SqlClient from 'effect/sql/SqlClient'",
      errors: [{ messageId: 'sql' }],
    },
    {
      filename: file('modules/study/service.ts'),
      code: 'export const value = 1',
      errors: [{ messageId: 'filename' }],
    },
    {
      filename: file('modules/study/study.http.ts'),
      code: 'export const value = 1',
      errors: [{ messageId: 'filename' }],
    },
  ],
})

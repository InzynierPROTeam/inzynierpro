import { RuleTester } from 'oxlint/plugins-dev'

import { noModuleDefectsRule } from './no-module-defects.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const error = { messageId: 'defect' }
const file = (path: string) => `/repo/apps/api/src/modules/study/${path}`

tester.run('conventions/no-module-defects', noModuleDefectsRule, {
  valid: [
    {
      filename: file('application/end-session.command.ts'),
      code: 'const run = Effect.gen(function* () { return yield* new StudySessionMissing() })',
    },
    {
      filename: file('infrastructure/study.repository.postgres.ts'),
      code: 'const row = query.pipe(Effect.orDie)',
    },
    { filename: '/repo/apps/api/src/lib/rate-limit.ts', code: 'const failed = Effect.die(error)' },
    { filename: file('application/start-session.command.ts'), code: 'const value = other.die()' },
    {
      filename: file('application/path-access.policy.test.ts'),
      code: "const unused = () => Effect.die('not used by this test')",
    },
  ],
  invalid: [
    {
      filename: file('application/end-session.command.ts'),
      code: "const missing = Effect.die('Session not found')",
      errors: [error],
    },
    {
      filename: file('application/submit-answer.command.ts'),
      code: 'const stored = record.pipe(Effect.orDie)',
      errors: [error],
    },
    {
      filename: file('http/handlers.ts'),
      code: "const failed = Effect.dieMessage('unreachable')",
      errors: [error],
    },
    {
      filename: file('domain/study-session.rules.ts'),
      code: 'const checked = check.pipe(Effect.orDieWith(toError))',
      errors: [error],
    },
  ],
})

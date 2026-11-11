import { RuleTester } from 'oxlint/plugins-dev'

import { tracedBackendOperationsRule } from './traced-backend-operations.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })

const command = '/repo/apps/api/src/modules/preparation/select-path.command.ts'
const query = '/repo/apps/api/src/modules/exam-calendar/goal-options.query.ts'
const reader = '/repo/apps/api/src/modules/study/study.reader.postgres.ts'

tester.run('conventions/traced-backend-operations', tracedBackendOperationsRule, {
  valid: [
    {
      code: "export const selectPath = Effect.fn('Preparation.selectPath')(function* () {})",
      filename: command,
    },
    {
      code: "export const getGoalOptions = Effect.fn('ExamCalendar.getGoalOptions')(function* () {})",
      filename: query,
    },
    {
      code: "StudyReader.of({ documents: Effect.fn('StudyReader.documents')(function* () {}) })",
      filename: reader,
    },
    // Helpers outside the backend roles are free to stay plain functions.
    { code: 'export const policy = () => Effect.void', filename: '/repo/apps/api/src/lib/x.ts' },
    {
      code: 'export const requirePathAccess = () => Effect.void',
      filename: '/repo/apps/api/src/modules/preparation/path-access.policy.ts',
    },
  ],
  invalid: [
    {
      code: 'export const selectPath = () => Effect.gen(function* () {})',
      filename: command,
      errors: [
        {
          messageId: 'untraced',
          data: { name: 'selectPath', span: 'Preparation.selectPath' },
        },
      ],
    },
    {
      code: 'StudyReader.of({ documents: (userId) => sql`SELECT 1` })',
      filename: reader,
      errors: [
        {
          messageId: 'untraced',
          data: { name: 'documents', span: 'StudyReader.documents' },
        },
      ],
    },
    {
      code: "StudyReader.of({ documents: Effect.fn('StudyReader.document')(function* () {}) })",
      filename: reader,
      errors: [
        {
          messageId: 'misnamed',
          data: { name: 'documents', span: 'StudyReader.documents' },
        },
      ],
    },
  ],
})

import { RuleTester } from 'oxlint/plugins-dev'

import { directoryNamesRule } from './directory-names.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const code = 'export const value = 1'
const error = (name: string) => ({ messageId: 'kebab', data: { name } })

tester.run('conventions/directory-names', directoryNamesRule, {
  valid: [
    { code, filename: '/repo/apps/api/src/modules/qualification-paths/application/x.query.ts' },
    { code, filename: '/repo/packages/ui/src/components/containers/in-view.tsx' },
    { code, filename: '/repo/packages/api-client/src/modules/health.ts' },
    { code, filename: '/repo/apps/e2e/src/test/fixtures.ts' },
    { code, filename: '/repo/apps/platform/src/features/learningSession/actions.ts' },
    { code, filename: '/repo/apps/platform/src/features/auth/components/SignInForm.tsx' },
    { code, filename: '/repo/apps/platform/src/routes/(app)/_authenticated/index.tsx' },
    { code, filename: '/repo/apps/platform/src/routes/(public)/_layout/_oralValid/a.tsx' },
    { code, filename: '/repo/apps/platform/src/routes/kategoria/$id/index.tsx' },
    { code, filename: '/repo/apps/platform/src/routes/__root.tsx' },
    { code, filename: '/repo/scripts/coverage-summary.ts' },
    { code, filename: 'C:\\repo\\packages\\react-utils\\src\\web\\query-client.ts' },
  ],
  invalid: [
    {
      code,
      filename: '/repo/apps/api/src/modules/examCalendar/domain/errors.ts',
      errors: [error('examCalendar')],
    },
    {
      code,
      filename: '/repo/packages/ui/src/Components/button.tsx',
      errors: [error('Components')],
    },
    {
      code,
      filename: '/repo/packages/utils/src/date_helpers/format.ts',
      errors: [error('date_helpers')],
    },
    {
      code,
      filename: '/repo/apps/platform/src/features/learning-session/components/x/Card.tsx',
      errors: [{ messageId: 'feature', data: { name: 'learning-session' } }],
    },
    {
      code,
      filename: '/repo/apps/platform/src/features/auth/Components/SignInForm.tsx',
      errors: [error('Components')],
    },
    {
      code,
      filename: '/repo/apps/platform/src/lib/_internal/x.ts',
      errors: [error('_internal')],
    },
    {
      code,
      filename: '/repo/apps/platform/src/routes/(App)/index.tsx',
      errors: [{ messageId: 'route', data: { name: '(App)' } }],
    },
  ],
})

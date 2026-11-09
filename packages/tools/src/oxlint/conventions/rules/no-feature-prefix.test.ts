import { RuleTester } from 'oxlint/plugins-dev'

import { noFeaturePrefixRule } from './no-feature-prefix.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const code = 'export const value = 1'

tester.run('conventions/no-feature-prefix', noFeaturePrefixRule, {
  valid: [
    { code, filename: '/repo/apps/platform/src/features/auth/actions.ts' },
    { code, filename: '/repo/apps/platform/src/features/auth/components/SignInForm.tsx' },
    { code, filename: '/repo/apps/platform/src/features/home/HomePage.tsx' },
    { code, filename: '/repo/apps/platform/src/lib/auth-client.ts' },
  ],
  invalid: [
    {
      code,
      filename: '/repo/apps/platform/src/features/auth/auth-actions.ts',
      errors: [{ messageId: 'prefixed', data: { name: 'auth-actions', suggestion: 'actions' } }],
    },
    {
      code,
      filename: '/repo/apps/platform/src/features/auth/components/auth-card.tsx',
      errors: [{ messageId: 'prefixed', data: { name: 'auth-card', suggestion: 'card' } }],
    },
  ],
})

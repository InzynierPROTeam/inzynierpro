import { RuleTester } from 'oxlint/plugins-dev'

import { hooksInHooksFolderRule } from './hooks-in-hooks-folder.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const error = { messageId: 'misplaced' }
const code = 'export const useThing = () => 1'

tester.run('conventions/hooks-in-hooks-folder', hooksInHooksFolderRule, {
  valid: [
    { code, filename: '/repo/apps/platform/src/hooks/useThing.ts' },
    { code, filename: '/repo/apps/platform/src/features/auth/hooks/useSignOutMutation.ts' },
    { code, filename: '/repo/apps/platform/src/features/auth/actions.ts' },
    { code, filename: '/repo/apps/platform/src/features/auth/user-card.ts' },
    { code, filename: '/repo/packages/ui/src/components/useless.ts' },
    { code, filename: '/repo/packages/react-utils/src/useTheme.ts' },
  ],
  invalid: [
    { code, filename: '/repo/apps/platform/src/features/auth/useSignOut.ts', errors: [error] },
    { code, filename: '/repo/apps/platform/src/lib/useApi.tsx', errors: [error] },
  ],
})

import { RuleTester } from 'oxlint/plugins-dev'

import { preferGapRule } from './prefer-gap.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const filename = '/repo/apps/platform/src/components/Panel.tsx'
const error = { messageId: 'gap' }

tester.run('conventions/prefer-gap', preferGapRule, {
  valid: [
    { filename, code: 'const Panel = () => <div className="flex flex-col gap-6" />' },
    { filename, code: 'const Panel = () => <p title="space-y-4">Spacing documentation</p>' },
    { filename, code: 'const text = "space-y-4"' },
    { filename, code: 'const Panel = () => <div className="flex *:not-first:-ms-2" />' },
  ],
  invalid: [
    { filename, code: 'const Panel = () => <div className="space-y-6" />', errors: [error] },
    {
      filename,
      code: 'const Panel = () => <div className={cn("md:space-x-2", active && "flex")} />',
      errors: [error],
    },
    {
      filename,
      code: 'const Panel = () => <div className={`flex ${active} space-y-4`} />',
      errors: [error],
    },
    { filename, code: 'const linkClassName = "space-x-2"', errors: [error] },
    {
      filename: '/repo/packages/ui/src/components/avatar.tsx',
      code: 'const variants = tv({ base: "flex -space-x-2" })',
      errors: [error],
    },
  ],
})

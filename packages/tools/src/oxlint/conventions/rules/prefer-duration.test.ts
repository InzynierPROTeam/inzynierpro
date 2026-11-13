import { RuleTester } from 'oxlint/plugins-dev'

import { preferDurationRule } from './prefer-duration.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/apps/platform/src/query.ts'
const errors = [{ messageId: 'duration' }]

tester.run('conventions/prefer-duration', preferDurationRule, {
  valid: [
    {
      filename,
      code: 'const options = {staleTime: Duration.toMillis(Duration.minutes(5)), gcTime: 0}',
    },
    { filename, code: 'const count = 60 * 3' },
    { filename: filename.replace('.ts', '.test.ts'), code: 'setTimeout(done, 500)' },
  ],
  invalid: [
    { filename, code: 'const age = 365 * 24 * 60 * 60', errors },
    { filename, code: 'const age = 5 * 60 * 1000', errors },
    { filename, code: 'const options = {staleTime: 5000}', errors },
    { filename, code: 'setTimeout(done, 500)', errors },
  ],
})

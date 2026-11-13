import { RuleTester } from 'oxlint/plugins-dev'

import { queryKeysRule } from './query-keys.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/packages/queries/src/modules/exam-calendar.ts'

// Concrete keys are owned by XKeys; using options.queryKey remains valid in consumers.
tester.run('conventions/query-keys', queryKeysRule, {
  valid: [
    { filename, code: 'effectQueryOptions(examKeys.list(req), action(req), client)' },
    { filename, code: 'effectInfiniteQueryOptions(examKeys.listInfinite(req), action, client)' },
    {
      filename,
      code: "const examKeys = { all: ['exams'] as const, list: req => [...examKeys.all, req] as const, listInfinite: req => [...examKeys.list(req), 'infinite'] as const }",
    },
    {
      filename,
      code: "import { examKeys as keys } from './keys'; effectQueryOptions(keys.list(req), action, client)",
    },
    {
      filename: '/repo/apps/platform/src/features/examPaths/actions.ts',
      code: 'client.getQueryData(options.queryKey)',
    },
    {
      filename: filename.replace('.ts', '.test.ts'),
      code: 'effectQueryOptions([1], action, client)',
    },
  ],
  invalid: [
    {
      filename,
      code: "effectInfiniteQueryOptions([...examKeys.list(req), 'infinite'], action, client)",
      errors: [{ messageId: 'factory' }],
    },
    {
      filename,
      code: 'effectQueryOptions(key, action, client)',
      errors: [{ messageId: 'factory' }],
    },
    {
      filename,
      code: 'effectQueryOptions(examKeys.all, action, client)',
      errors: [{ messageId: 'factory' }],
    },
    {
      filename,
      code: "import { effectQueryOptions as options } from '../lib/effect-query-options.js'; options([], action, client)",
      errors: [{ messageId: 'factory' }],
    },
    {
      filename,
      code: "const key = [...examKeys.list(req), 'infinite']",
      errors: [{ messageId: 'extension' }],
    },
    {
      filename: '/repo/apps/platform/src/features/examPaths/actions.ts',
      code: "client.invalidateQueries({queryKey: [...examKeys.all, 'paths']})",
      errors: [{ messageId: 'extension' }],
    },
    {
      filename,
      code: "import { examKeys as keys } from './keys'; const key = [...keys.all, 'paths']",
      errors: [{ messageId: 'extension' }],
    },
  ],
})

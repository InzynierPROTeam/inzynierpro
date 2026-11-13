import { RuleTester } from 'oxlint/plugins-dev'

import { infiniteQueryNamesRule } from './infinite-query-names.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/packages/queries/src/modules/preparation.ts'
const prefix = "import { effectInfiniteQueryOptions } from '~queries/lib/effect-query-options.js'; "
const error = { messageId: 'name' }

tester.run('conventions/infinite-query-names', infiniteQueryNamesRule, {
  valid: [
    {
      filename,
      code:
        prefix +
        'export const pathsInfiniteQueryOptions = () => effectInfiniteQueryOptions(key, fn, client)',
    },
    {
      filename,
      code: 'export const pathsQueryOptions = () => effectQueryOptions(key, fn, client)',
    },
    {
      filename: filename.replace('.ts', '.test.ts'),
      code: prefix + 'const options = () => effectInfiniteQueryOptions(key, fn, client)',
    },
  ],
  invalid: [
    {
      filename,
      code:
        prefix +
        'export const pathsQueryOptions = () => effectInfiniteQueryOptions(key, fn, client)',
      errors: [error],
    },
    {
      filename,
      code: "import { effectInfiniteQueryOptions as infinite } from '../lib/effect-query-options.js'; export function pathsQueryOptions() { return infinite(key, fn, client) }",
      errors: [error],
    },
    {
      filename,
      code: "import * as options from '../lib/effect-query-options.js'; export const paths = () => options.effectInfiniteQueryOptions(key, fn, client)",
      errors: [error],
    },
  ],
})

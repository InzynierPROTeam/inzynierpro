import { RuleTester } from 'oxlint/plugins-dev'

import { noReexports } from './no-reexports.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const error = { messageId: 'reexport' }

tester.run('architecture/no-reexports', noReexports, {
  valid: [
    'export const value = 1',
    'export default function make() { return 1 }',
    'const value = 1; export { value }',
    'const value = 1; export default value',
    'type Value = string; export type { Value }',
    'import { value } from "./owner"; export const doubled = value * 2',
    'import { value } from "./owner"; const doubled = value * 2; export { doubled }',
    'import type { Value } from "./owner"; export type Values = readonly Value[]',
  ],
  invalid: [
    { code: 'export { value } from "./owner"', errors: [error] },
    { code: 'export { value as renamed } from "./owner"', errors: [error] },
    { code: 'export type { Value } from "./owner"', errors: [error] },
    { code: 'export * from "./owner"', errors: [error] },
    { code: 'export * as owner from "./owner"', errors: [error] },
    { code: 'import { value } from "./owner"; export { value }', errors: [error] },
    {
      code: 'import { value as local } from "./owner"; export { local as renamed }',
      errors: [error],
    },
    { code: 'import value from "./owner"; export { value }', errors: [error] },
    { code: 'import value from "./owner"; export default value', errors: [error] },
    { code: 'import * as owner from "./owner"; export { owner }', errors: [error] },
    { code: 'import type { Value } from "./owner"; export type { Value }', errors: [error] },
    { code: 'export { value }; import { value } from "./owner"', errors: [error] },
  ],
})

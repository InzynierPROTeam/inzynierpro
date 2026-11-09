import { RuleTester } from 'oxlint/plugins-dev'

import { queriesWrapActionsRule } from './queries-wrap-actions.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const error = { messageId: 'logic' }
const filename = '/repo/packages/queries/src/modules/identity.ts'

tester.run('conventions/queries-wrap-actions', queriesWrapActionsRule, {
  valid: [
    {
      code: 'export const options = (client) => effectQueryOptions(keys.session(), getSession, client)',
      filename,
    },
    {
      code: 'export const options = (client) => effectQueryOptions(keys.all, getSession.pipe(Effect.option), client)',
      filename: '/repo/packages/api-client/src/modules/identity.ts',
    },
    {
      code: 'const response = Effect.runPromise(action.pipe(Effect.provide(layer)))',
      filename: '/repo/packages/queries/src/modules/identity.test.ts',
    },
  ],
  invalid: [
    {
      code: 'export const options = (client) => effectQueryOptions(keys.all, getSession.pipe(Effect.option), client)',
      filename,
      errors: [error],
    },
    {
      code: 'export const options = (client) => effectQueryOptions(keys.all, pipe(getSession, Effect.option), client)',
      filename,
      errors: [error],
    },
    {
      code: 'export const options = (client) => effectQueryOptions(keys.all, Effect.map(getSession, f), client)',
      filename,
      errors: [error],
    },
  ],
})

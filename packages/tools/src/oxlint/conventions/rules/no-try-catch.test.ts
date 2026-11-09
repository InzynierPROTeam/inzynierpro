import { RuleTester } from 'oxlint/plugins-dev'

import { noTryCatchRule } from './no-try-catch.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const error = { messageId: 'tryCatch' }

tester.run('conventions/no-try-catch', noTryCatchRule, {
  valid: [
    'try { run() } finally { close() }',
    'const result = Effect.tryPromise(() => load()).pipe(Effect.option)',
    'promise.then(handle)',
  ],
  invalid: [
    { code: 'try { run() } catch (error) { report(error) }', errors: [error] },
    { code: 'try { run() } catch { recover() } finally { close() }', errors: [error] },
    {
      code: 'const load = async () => { try { return await fetchData() } catch { return null } }',
      errors: [error],
    },
  ],
})

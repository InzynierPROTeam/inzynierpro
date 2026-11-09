import { RuleTester } from 'oxlint/plugins-dev'

import { noSpreadRouteHooksRule } from './no-spread-route-hooks.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const error = { messageId: 'spread' }

tester.run('conventions/no-spread-route-hooks', noSpreadRouteHooksRule, {
  valid: [
    'const element = <SignInPage />',
    'const element = <Button {...props} />',
    'const element = <Page {...useLabels()} />',
    'const element = <Page redirect={Route.useSearch().redirect} />',
  ],
  invalid: [
    { code: 'const element = <SignInPage {...Route.useSearch()} />', errors: [error] },
    { code: 'const element = <Page {...pageRouteApi.useParams()} />', errors: [error] },
    { code: 'const element = <Page {...Route.useRouteContext()} />', errors: [error] },
    { code: 'const element = <Page {...Route.useLoaderData()} />', errors: [error] },
  ],
})

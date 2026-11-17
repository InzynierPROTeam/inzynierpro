import { RuleTester } from 'oxlint/plugins-dev'

import { apiClientContractsRule } from './api-client-contracts.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/packages/api-client/src/modules/written-study/actions.ts'

const imports = `import { apiAction } from '~api-client/lib/api-action.js';
import type { InferEndpointRequest } from '~api-client/lib/types.js';
import type { GetPathEndpoint } from '@inzpro/api-contracts/modules/study/api';`

const action =
  'export const getPath = (req: GetPathRequest) => apiAction(api => api.Study.GetPath(req));'

const types = `export type GetPathRequest = InferEndpointRequest<typeof GetPathEndpoint>;
export type GetPathRes = Effect.Success<ReturnType<typeof getPath>>;
export type GetPathError = Effect.Error<ReturnType<typeof getPath>>;`

const code = `${imports}\n${action}\n${types}`

tester.run('conventions/api-client-contracts', apiClientContractsRule, {
  valid: [
    { filename, code },
    { filename, code: code.replace('req: GetPathRequest)', 'req: GetPathRequest = {})') },
    {
      filename,
      code: code
        .replace('{ apiAction }', '{ apiAction as makeAction }')
        .replace('=> apiAction(', '=> makeAction(')
        .replace('{ InferEndpointRequest }', '{ InferEndpointRequest as RequestOf }')
        .replace('= InferEndpointRequest<', '= RequestOf<'),
    },
    { filename, code: `${code}\n export type GetPathErrorType = GetPathError['type']` },
    { filename: filename.replace('.ts', '.test.ts'), code: 'export const getPath = () => 1' },
  ],
  invalid: [
    {
      filename,
      code: `${imports}\nexport const getPath = apiAction(api => api.Study.GetPath());\n${types}`,
      errors: [{ messageId: 'request' }],
    },
    { filename, code: `${imports}\n${types}\n${action}`, errors: [{ messageId: 'group' }] },
    {
      filename,
      code: code.replace('req: GetPathRequest', 'request: GetPathRequest'),
      errors: [{ messageId: 'request' }],
    },
    {
      filename,
      code: code.replace('req: GetPathRequest', 'req'),
      errors: [{ messageId: 'request' }],
    },
    {
      filename,
      code: code.replace('req: GetPathRequest', 'req?: GetPathRequest'),
      errors: [{ messageId: 'request' }],
    },
    {
      filename,
      code: code.replace('req: GetPathRequest', 'id: string, req: GetPathRequest'),
      errors: [{ messageId: 'request' }],
    },
    {
      filename,
      code: code.replace(
        'InferEndpointRequest<typeof GetPathEndpoint>',
        '{ readonly params: { readonly id: string } }',
      ),
      errors: [{ messageId: 'inferred' }],
    },
    {
      filename,
      code: code.replace('api.Study.GetPath(req)', 'api.Study.GetPath({ params: { id: req } })'),
      errors: [{ messageId: 'forward' }],
    },
  ],
})

import { RuleTester } from 'oxlint/plugins-dev'

import { requestSchemasRule } from './request-schemas.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/packages/api-contracts/src/modules/study/api.ts'
const factory = "import { HttpApiEndpoint } from 'effect/http-api';"

tester.run('conventions/request-schemas', requestSchemasRule, {
  valid: [
    {
      filename: filename.replace('api.ts', 'endpoints/quiz.ts'),
      code: `${factory} import { Body } from '../requests/quiz/answer.js'; const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Body })`,
    },

    {
      filename,
      code: `${factory} import { DocumentsQuery } from './requests.js'; const endpoint = HttpApiEndpoint.get('Get', '/', { query: DocumentsQuery })`,
    },
    {
      filename,
      code: `${factory} const endpoint = HttpApiEndpoint.get('Get', '/', { success: Response })`,
    },
    {
      filename: filename.replace('api.ts', 'requests.ts'),
      code: 'export const DocumentsQuery = Schema.Struct({ limit: Schema.Int })',
    },
    { filename, code: 'const unrelated = other.get({ payload: Schema.String })' },
    {
      filename,
      code: "import { HttpApiEndpoint as Endpoint } from 'effect/http-api'; import { Body as Request } from '~api-contracts/modules/study/requests.js'; const endpoint = Endpoint.post('Save', '/', { payload: Request })",
    },
  ],
  invalid: [
    {
      filename: filename.replace('api.ts', 'endpoints/quiz.ts'),
      code: `${factory} const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Schema.String })`,
      errors: [{ messageId: 'misplaced' }],
    },

    {
      filename,
      code: `${factory} const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Schema.Struct({ pathId: Uuid }) })`,
      errors: [{ messageId: 'misplaced' }],
    },
    {
      filename,
      code: `${factory} import { Body } from '@inzpro/domain/body'; const endpoint = HttpApiEndpoint.post('Save', '/', { payload: Body })`,
      errors: [{ messageId: 'misplaced' }],
    },
    {
      filename,
      code: `${factory} const Params = Schema.Struct({ id: Uuid }); const endpoint = HttpApiEndpoint.get('Get', '/', { params: Params })`,
      errors: [{ messageId: 'misplaced' }],
    },
  ],
})

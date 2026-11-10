import { RuleTester } from 'oxlint/plugins-dev'

import { domainIdentifiersRule } from './domain-identifiers.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/packages/domain/src/modules/learning-content/question-answer.ts'

tester.run('conventions/domain-identifiers', domainIdentifiersRule, {
  valid: [
    {
      filename,
      code: "import { Uuid } from '~domain/common/id.js'; export const AnswerId = Uuid.pipe(Schema.brand('AnswerId'))",
    },
    {
      filename,
      code: "import { Uuid as BaseId } from '~domain/common/id.js'; export const AnswerId = BaseId.pipe(Schema.brand('AnswerId'))",
    },
    { filename, code: 'export type AnswerId = typeof AnswerId.Type' },
    { filename, code: 'export const QuestionCount = Schema.Int' },
    {
      filename: '/repo/packages/domain/src/common/id.ts',
      code: 'export const Uuid = Schema.String.check(Schema.isUUID())',
    },
    { filename: filename.replace('.ts', '.test.ts'), code: 'export const invalidId = "invalid"' },
  ],
  invalid: [
    {
      filename,
      code: "import { Uuid } from '~domain/common/id.js'; export const AnswerId = Uuid.pipe()",
      errors: [{ messageId: 'uuid' }],
    },
    {
      filename,
      code: "export const AnswerId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand('AnswerId'))",
      errors: [{ messageId: 'uuid' }],
    },
    {
      filename,
      code: "export const AnswerId = Schema.String.pipe(Schema.brand('AnswerId'))",
      errors: [{ messageId: 'uuid' }],
    },
    {
      filename,
      code: "const Uuid = Schema.String; export const AnswerId = Uuid.pipe(Schema.brand('AnswerId'))",
      errors: [{ messageId: 'uuid' }],
    },
    {
      filename: filename.replace('question-answer.ts', 'question-answer-id.ts'),
      code: 'export type AnswerId = string',
      errors: [{ messageId: 'filename' }],
    },
  ],
})

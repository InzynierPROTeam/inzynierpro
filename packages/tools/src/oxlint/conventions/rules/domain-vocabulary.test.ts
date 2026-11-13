import { RuleTester } from 'oxlint/plugins-dev'

import { domainVocabularyRule } from './domain-vocabulary.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const file = '/repo/packages/domain/src/modules/preparation/exam-access.ts'

tester.run('conventions/domain-vocabulary', domainVocabularyRule, {
  valid: [
    {
      filename: file,
      code: "import { Schema } from 'effect'; export const ExamPart = Schema.Literals(['written', 'oral'])",
    },
    {
      filename: file,
      code: "import { Schema } from 'effect'; export const Id = Uuid.pipe(Schema.brand('Id'))",
    },
    {
      filename: file.replace('.ts', '.test.ts'),
      code: "import { Schema } from 'effect'; const Fixture = Schema.Struct({})",
    },
    {
      filename: '/repo/packages/api-contracts/src/modules/preparation/responses.ts',
      code: "import { Schema } from 'effect'; export const Goal = Schema.Struct({})",
    },
  ],
  invalid: [
    {
      filename: file,
      code: "import { Schema } from 'effect'; export const Goal = Schema.Struct({})",
      errors: [{ messageId: 'object' }],
    },
    {
      filename: '/repo/packages/domain/src/common/pagination.ts',
      code: "import { Schema as S } from 'effect'; export const Meta = S.Struct({})",
      errors: [{ messageId: 'object' }],
    },
    {
      filename: file,
      code: "import * as S from 'effect/Schema'; export class Goal extends S.Class<Goal>('Goal')({}) {}",
      errors: [{ messageId: 'object' }],
    },
    {
      filename: file,
      code: "import { TaggedStruct } from 'effect/Schema'",
      errors: [{ messageId: 'object' }],
    },
  ],
})

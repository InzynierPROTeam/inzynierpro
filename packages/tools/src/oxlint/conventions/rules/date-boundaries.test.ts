import { RuleTester } from 'oxlint/plugins-dev'

import { dateBoundariesRule } from './date-boundaries.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const dto = '/repo/packages/api-contracts/src/modules/preparation/responses.ts'
const client = '/repo/apps/platform/src/features/start/Tile.ts'
const backend = '/repo/apps/api/src/modules/preparation/application/change-goal.command.ts'
const mappers = '/repo/apps/api/src/modules/preparation/http/mappers.ts'
const model = '/repo/apps/api/src/modules/preparation/domain/preparation.model.ts'

tester.run('conventions/date-boundaries', dateBoundariesRule, {
  valid: [
    {
      filename: dto,
      code: "import { Schema } from 'effect'; const Goal = Schema.Struct({at: UtcIsoDateTime, optional: Schema.NullOr(UtcIsoDateTime)})",
    },
    { filename: client, code: "import {formatDateTime} from '@inzpro/utils/date'" },
    { filename: client, code: "import type {DateTime} from 'effect'" },
    {
      filename: backend,
      code: "import {UserExamGoal} from '~api/modules/preparation/domain/preparation.model.js'",
    },
    {
      filename: mappers,
      code: "import {UtcIsoDateTime} from '@inzpro/domain/common/date-time'",
    },
    {
      filename: '/repo/packages/api-contracts/src/utils/pagination.ts',
      code: "import {Schema} from 'effect'; const limit = Schema.FiniteFromString.pipe(Schema.decodeTo(PageLimit))",
    },
    {
      filename: '/repo/packages/api-contracts/src/modules/study/requests.ts',
      code: "import {Schema} from 'effect'; const position = Schema.FiniteFromString.pipe(Schema.decodeTo(SessionQuestionPosition))",
    },
    { filename: client.replace('.ts', '.test.ts'), code: "import {DateTime} from 'effect'" },
  ],
  invalid: [
    {
      filename: '/repo/packages/api-contracts/src/modules/study/responses.ts',
      code: "import {Schema} from 'effect'; const position = Schema.FiniteFromString.pipe(Schema.decodeTo(SessionQuestionPosition))",
      errors: [{ messageId: 'json' }],
    },
    {
      filename: '/repo/packages/api-contracts/src/modules/study/requests.ts',
      code: "import {Schema} from 'effect'; const at = Schema.String.pipe(Schema.decodeTo(Schema.DateTimeUtcFromString))",
      errors: [{ messageId: 'json' }, { messageId: 'json' }],
    },
    {
      filename: '/repo/packages/api-contracts/src/utils/pagination.ts',
      code: "import {Schema} from 'effect'; const at = Schema.String.pipe(Schema.decodeTo(Schema.DateTimeUtcFromString))",
      errors: [{ messageId: 'json' }, { messageId: 'json' }],
    },
    {
      filename: backend,
      code: 'interface Goal {writtenAt: string}',
      errors: [{ messageId: 'backend' }],
    },
    {
      filename: model,
      code: "import {Schema} from 'effect'; const Goal = Schema.Struct({writtenAt: Schema.String})",
      errors: [{ messageId: 'backend' }],
    },
    {
      filename: dto,
      code: "import * as Dates from '@inzpro/domain/common/date-time'; const Goal = Dates.DateTimeUtc",
      errors: [{ messageId: 'json' }],
    },

    {
      filename: dto,
      code: "import {Schema as S} from 'effect'; const Goal = S.Struct({at: S.DateTimeUtcFromString})",
      errors: [{ messageId: 'json' }],
    },
    {
      filename: dto,
      code: "import * as S from 'effect/Schema'; const Goal = S.OptionFromNullOr(S.String)",
      errors: [{ messageId: 'json' }],
    },
    {
      filename: dto,
      code: "import {DateTimeUtc as Codec} from '@inzpro/domain/common/date-time'",
      errors: [{ messageId: 'json' }],
    },
    {
      filename: dto,
      code: "import {OptionFromNullOr as optional} from 'effect/Schema'",
      errors: [{ messageId: 'json' }],
    },
    {
      filename: dto,
      code: "import {Schema} from 'effect'; const Goal = Schema.String.pipe(Schema.decodeTo(Internal))",
      errors: [{ messageId: 'json' }],
    },
    {
      filename: client.replaceAll('/', '\\'),
      code: "import {DateTime as DT} from 'effect'",
      errors: [{ messageId: 'client' }],
    },
    {
      filename: client,
      code: "import * as E from 'effect'; E.DateTime.makeUnsafe(value)",
      errors: [{ messageId: 'client' }],
    },
    {
      filename: client,
      code: "import * as DT from 'effect/DateTime'",
      errors: [{ messageId: 'client' }],
    },
    {
      filename: client,
      code: 'const start = {serializationAdapters: [adapter]}',
      errors: [{ messageId: 'serializer' }],
    },
    {
      filename: backend,
      code: "import {UtcIsoDateTime} from '@inzpro/domain/common/date-time'",
      errors: [{ messageId: 'backend' }],
    },
  ],
})

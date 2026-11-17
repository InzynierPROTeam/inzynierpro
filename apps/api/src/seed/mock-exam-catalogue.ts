import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  ExamBlueprintId,
  ExamDurationMinutes,
  ExamSectionName,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Layer, Option } from 'effect'
import { TransactionLive } from '~api/lib/transaction.js'
import { assignBlueprint } from '~api/modules/mock-exams/application/assign-blueprint.command.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { publishBlueprintVersion } from '~api/modules/mock-exams/application/publish-blueprint-version.command.js'
import { MockExamReaderLive } from '~api/modules/mock-exams/infrastructure/mock-exam.reader.postgres.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'

import { catalogueId } from './catalogue-id.js'
import { buildingLaw, technicalConditions } from './written-content.js'

const demonstrativeBlueprint = ExamBlueprintId.make(catalogueId('47', 1))

export const seedMockExamCatalogue = Effect.gen(function* () {
  const mockExamReader = yield* MockExamReader
  const existing = yield* mockExamReader.blueprint(demonstrativeBlueprint)

  if (Option.isNone(existing)) {
    yield* publishBlueprintVersion(demonstrativeBlueprint, {
      durationMinutes: ExamDurationMinutes.make(10),
      passThreshold: QuestionCount.make(6),
      sections: [
        {
          name: ExamSectionName.make('Prawo budowlane'),
          questionCount: QuestionCount.make(5),
          documentIds: [buildingLaw],
        },
        {
          name: ExamSectionName.make('Warunki techniczne'),
          questionCount: QuestionCount.make(5),
          documentIds: [technicalConditions],
        },
      ],
    })
  }

  yield* assignBlueprint(demonstrativeBlueprint, QualificationPathId.make(catalogueId('10', 1)))
}).pipe(Effect.provide(Layer.mergeAll(MockExamReaderLive, MockExamRepositoryLive, TransactionLive)))

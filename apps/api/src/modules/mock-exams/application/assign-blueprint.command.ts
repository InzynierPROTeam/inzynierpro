import type { ExamBlueprintId } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import {
  ExamBlueprintNotFound,
  InvalidExamBlueprint,
} from '~api/modules/mock-exams/domain/errors.js'
import { examBlueprintViolation } from '~api/modules/mock-exams/domain/exam-blueprint.rules.js'

export const assignBlueprint = Effect.fn('MockExams.assignBlueprint')(function* (
  blueprintId: ExamBlueprintId,
  pathId: QualificationPathId,
) {
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* mockExamRepository.lockBlueprint(blueprintId)
      const latest = yield* mockExamReader.blueprint(blueprintId)

      if (Option.isNone(latest)) {
        return yield* new ExamBlueprintNotFound()
      }

      const draft = {
        ...latest.value,
        sections: latest.value.sections.map(section => ({
          ...section,
          documentIds: section.documents.map(document => document.id),
        })),
      }

      const violation = examBlueprintViolation(draft, [
        yield* mockExamReader.pathDocumentIds(pathId),
      ])

      if (Option.isSome(violation)) {
        return yield* new InvalidExamBlueprint({ reason: violation.value })
      }

      yield* mockExamRepository.assignBlueprint(pathId, blueprintId)
    }),
  )
})

import {
  type ExamBlueprintId,
  firstExamBlueprintVersion,
  nextExamBlueprintVersion,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { InvalidExamBlueprint } from '~api/modules/mock-exams/domain/errors.js'
import type { ExamBlueprintDraft } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import { examBlueprintViolation } from '~api/modules/mock-exams/domain/exam-blueprint.rules.js'

export const publishBlueprintVersion = Effect.fn('MockExams.publishBlueprintVersion')(function* (
  blueprintId: ExamBlueprintId,
  draft: ExamBlueprintDraft,
) {
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* mockExamRepository.createBlueprint(blueprintId)
      yield* mockExamRepository.lockBlueprint(blueprintId)

      const pathIds = yield* mockExamReader.assignedPaths(blueprintId)
      const pathDocuments = yield* Effect.forEach(pathIds, mockExamReader.pathDocumentIds)
      const violation = examBlueprintViolation(draft, pathDocuments)

      if (Option.isSome(violation)) {
        return yield* new InvalidExamBlueprint({ reason: violation.value })
      }

      const latest = yield* mockExamReader.blueprint(blueprintId)

      const version = Option.match(latest, {
        onNone: () => firstExamBlueprintVersion,
        onSome: current => nextExamBlueprintVersion(current.version),
      })

      yield* mockExamRepository.insertBlueprintVersion({ ...draft, blueprintId, version })

      return version
    }),
  )
})

import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import type { ExamBlueprintPreview } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import { examUnavailableReason } from '~api/modules/mock-exams/domain/exam-blueprint.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const getMockExamPreview = Effect.fn('MockExams.getMockExamPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const mockExamReader = yield* MockExamReader
  const found = yield* mockExamReader.pathBlueprint(pathId)

  const blueprint = yield* Effect.transposeOption(
    Option.map(found, current =>
      Effect.map(
        mockExamReader.sectionEligibility(pathId, current.id, current.version),
        (eligibility): ExamBlueprintPreview => ({
          ...current,
          sections: current.sections.map(section => ({
            ...section,
            availableQuestionCount:
              eligibility.find(({ position }) => position === section.position)
                ?.availableQuestionCount ?? QuestionCount.make(0),
          })),
        }),
      ),
    ),
  )

  return {
    qualificationPathId: pathId,
    blueprint,
    unavailableReason: examUnavailableReason(blueprint),
    unfinishedAttempt: yield* mockExamReader.unfinishedAttempt(userId, pathId),
  }
})

import type { UserId } from '@inzpro/domain/modules/identity/user'
import { noExamBlueprint } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import {
  MockExamAttemptNotFound,
  MockExamUnavailable,
} from '~api/modules/mock-exams/domain/errors.js'
import {
  drawExamQuestions,
  shuffleAnswerOptions,
} from '~api/modules/mock-exams/domain/mock-exam-draw.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const startAttempt = Effect.fn('MockExams.startAttempt')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const mockExamReader = yield* MockExamReader
  const mockExamRepository = yield* MockExamRepository
  const preparationRepository = yield* PreparationRepository

  const readAttempt = (attemptId: MockExamAttemptId) =>
    mockExamReader.attempt(userId, pathId, attemptId).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new MockExamAttemptNotFound()),
          onSome: Effect.succeed,
        }),
      ),
    )

  return yield* mockExamRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, writtenExamAccess)

      const unfinished = yield* mockExamReader.unfinishedAttempt(userId, pathId)

      if (Option.isSome(unfinished)) {
        return yield* readAttempt(unfinished.value.id)
      }

      const blueprint = yield* mockExamReader.pathBlueprint(pathId)

      if (Option.isNone(blueprint)) {
        return yield* new MockExamUnavailable({ reason: noExamBlueprint })
      }

      const { id: blueprintId, version, sections } = blueprint.value
      const candidates = yield* mockExamReader.sectionCandidates(pathId, blueprintId, version)
      const drawn = yield* drawExamQuestions(sections, candidates)

      const answers = yield* mockExamReader.candidateAnswers(
        drawn.map(question => question.questionRevisionId),
      )

      const questions = yield* shuffleAnswerOptions(
        drawn.map(question => ({
          ...question,
          answerIds: answers
            .filter(answer => answer.questionRevisionId === question.questionRevisionId)
            .map(answer => answer.answerId),
        })),
      )

      const attemptId = yield* mockExamRepository.createAttempt({
        userId,
        qualificationPathId: pathId,
        blueprintId,
        blueprintVersion: version,
        startedAt: yield* DateTime.now,
        questions,
      })

      return yield* readAttempt(attemptId)
    }),
  )
})

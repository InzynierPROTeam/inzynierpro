import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralKnowledgeCheckOptionId } from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralQuizCheckPosition } from '@inzpro/domain/modules/study/oral-session-quiz'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  OralQuizCheckAlreadyChecked,
  OralQuizCheckMissing,
  OralQuizSelectionNotAllowed,
} from '~api/modules/study/domain/errors.js'
import {
  OralReviewEvidence,
  oralReviewRulesVersion,
} from '~api/modules/study/domain/oral-review-state.model.js'
import type { OralQuizCheck } from '~api/modules/study/domain/oral-session-quiz.model.js'
import {
  isAllowedSelection,
  isCorrectSelection,
  knowledgeCheckReviewRating,
} from '~api/modules/study/domain/oral-session-quiz.rules.js'

import { OralSessionQuizReader } from './oral-session-quiz.reader.js'
import { OralSessionQuizRepository } from './oral-session-quiz.repository.js'
import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { ReviewScheduler } from './review-state.service.js'
import { StudyRepository } from './study.repository.js'

const sameSelection = (
  stored: ReadonlyArray<OralKnowledgeCheckOptionId>,
  submitted: ReadonlyArray<OralKnowledgeCheckOptionId>,
) => stored.length === submitted.length && submitted.every(optionId => stored.includes(optionId))

const applyQuizEvidence = Effect.fn('Study.applyQuizEvidence')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  check: OralQuizCheck,
  isCorrect: boolean,
  answeredAt: DateTime.Utc,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const reviewScheduler = yield* ReviewScheduler

  const rating = knowledgeCheckReviewRating({
    isCorrect,
    answersCurrentContent: yield* oralStudyReader.carriesCurrentContent(check.oralRevisionId),
  })

  if (Option.isNone(rating)) {
    return
  }

  const card = yield* oralStudyReader.reviewState(userId, pathId, check.questionId)

  yield* oralStudyRepository.storeReviewState({
    userId,
    qualificationPathId: pathId,
    questionId: check.questionId,
    oralRevisionId: check.oralRevisionId,
    evidence: OralReviewEvidence.QuizAnswer({ quizId: check.quizId, position: check.position }),
    rulesVersion: oralReviewRulesVersion,
    card: reviewScheduler.review(check.questionId, card, rating.value, answeredAt),
  })
})

export const answerOralQuizCheck = Effect.fn('Study.answerOralQuizCheck')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
  position: OralQuizCheckPosition,
  optionIds: ReadonlyArray<OralKnowledgeCheckOptionId>,
) {
  const oralSessionQuizReader = yield* OralSessionQuizReader
  const oralSessionQuizRepository = yield* OralSessionQuizRepository
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, oralExamAccess)
      const found = yield* oralSessionQuizReader.check(userId, pathId, sessionId, position)

      if (Option.isNone(found)) {
        return yield* new OralQuizCheckMissing()
      }

      const check = found.value

      if (Option.isSome(check.answer)) {
        if (!sameSelection(check.answer.value.selectedOptionIds, optionIds)) {
          return yield* new OralQuizCheckAlreadyChecked()
        }
      } else {
        if (!isAllowedSelection(check.format, check.options, optionIds)) {
          return yield* new OralQuizSelectionNotAllowed()
        }

        const isCorrect = isCorrectSelection(check.options, optionIds)
        const answeredAt = yield* DateTime.now

        yield* oralSessionQuizRepository.recordAnswer(check.quizId, position, {
          selectedOptionIds: optionIds,
          isCorrect,
          answeredAt,
        })
        yield* applyQuizEvidence(userId, pathId, check, isCorrect, answeredAt)
      }

      const result = Option.all({
        check: yield* oralSessionQuizReader.check(userId, pathId, sessionId, position),
        quiz: yield* oralSessionQuizReader.quiz(userId, pathId, sessionId),
      })

      if (Option.isNone(result)) {
        return yield* new OralQuizCheckMissing()
      }

      return result.value
    }),
  )
})

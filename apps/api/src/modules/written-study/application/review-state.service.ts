import { Effect, Option } from 'effect'
import { ReviewScheduler } from '~api/modules/learning/application/review-scheduler.service.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import {
  type LearningEventContext,
  type NewWrittenEvidence,
  writtenReviewRulesVersion,
} from '~api/modules/written-study/domain/review-state.model.js'
import { writtenReviewRating } from '~api/modules/written-study/domain/review-state.rules.js'

export const recordWrittenEvidence = Effect.fn('Study.recordWrittenEvidence')(function* (
  evidence: NewWrittenEvidence,
  context: LearningEventContext,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const reviewScheduler = yield* ReviewScheduler
  const { userId, qualificationPathId: pathId, questionId } = evidence

  const answersCurrentContent = yield* studyReader.carriesCurrentContent(
    evidence.questionRevisionId,
  )

  const answeredToday = yield* studyReader.answeredContentOnStudyDay(
    userId,
    pathId,
    evidence.questionRevisionId,
    studyDayOf(context.answeredAt),
  )

  const learningEventId = yield* studyRepository.recordLearningEvent(evidence, context)
  const card = yield* studyReader.reviewState(userId, pathId, questionId)

  const rating = writtenReviewRating({
    isCorrect: evidence.isCorrect,
    assistance: context.assistance,
    isNewCard: Option.isNone(card),
    isFirstAnswerOfStudyDay: !answeredToday,
    answersCurrentContent,
  })

  if (Option.isSome(rating)) {
    yield* studyRepository.storeReviewState({
      userId,
      qualificationPathId: pathId,
      questionId,
      questionRevisionId: evidence.questionRevisionId,
      learningEventId,
      rulesVersion: writtenReviewRulesVersion,
      card: reviewScheduler.review(questionId, card, rating.value, context.answeredAt),
    })
  }
})

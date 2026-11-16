import { Effect, Option } from 'effect'
import {
  oralReviewRulesVersion,
  type NewOralEvidence,
} from '~api/modules/study/domain/oral-review-state.model.js'
import { oralReviewRating, studyDayOf } from '~api/modules/study/domain/review-state.rules.js'

import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { ReviewScheduler } from './review-state.service.js'

export const recordOralEvidence = Effect.fn('Study.recordOralEvidence')(function* (
  evidence: NewOralEvidence,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const reviewScheduler = yield* ReviewScheduler
  const { userId, qualificationPathId, questionId, oralRevisionId, answeredAt } = evidence
  const answersCurrentContent = yield* oralStudyReader.carriesCurrentContent(oralRevisionId)

  const answeredToday = yield* oralStudyReader.answeredContentOnStudyDay(
    userId,
    qualificationPathId,
    oralRevisionId,
    studyDayOf(answeredAt),
  )

  const learningEventId = yield* oralStudyRepository.recordLearningEvent(evidence)
  const card = yield* oralStudyReader.reviewState(userId, qualificationPathId, questionId)

  const rating = oralReviewRating({
    selfAssessment: evidence.selfAssessment,
    isFirstAnswerOfStudyDay: !answeredToday,
    answersCurrentContent,
  })

  if (Option.isSome(rating)) {
    yield* oralStudyRepository.storeReviewState({
      userId,
      qualificationPathId,
      questionId,
      oralRevisionId,
      learningEventId,
      rulesVersion: oralReviewRulesVersion,
      card: reviewScheduler.review(questionId, card, rating.value, answeredAt),
    })
  }
})

import { Effect, Option } from 'effect'
import { ReviewScheduler } from '~api/modules/learning/application/review-scheduler.service.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import {
  oralReviewRulesVersion,
  OralReviewEvidence,
  type NewOralEvidence,
} from '~api/modules/oral-study/domain/oral-review-state.model.js'
import { oralReviewRating } from '~api/modules/oral-study/domain/review-state.rules.js'

export const recordOralEvidence = Effect.fn('Study.recordOralEvidence')(function* (
  evidence: NewOralEvidence,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const reviewScheduler = yield* ReviewScheduler
  const { userId, qualificationPathId, questionId, oralRevisionId, answeredAt } = evidence
  const answersCurrentContent = yield* oralStudyReader.carriesCurrentContent(oralRevisionId)
  const studyDay = studyDayOf(answeredAt)

  const answeredToday = yield* oralStudyReader.answeredContentOnStudyDay(
    userId,
    qualificationPathId,
    oralRevisionId,
    studyDay,
  )

  const learningEventId = yield* oralStudyRepository.recordLearningEvent(evidence)

  yield* oralStudyRepository.recordSelfAssessmentStatistic({
    oralRevisionId,
    selfAssessment: evidence.selfAssessment,
    studyDay: studyDay.start,
  })

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
      evidence: OralReviewEvidence.SelfAssessment({ learningEventId }),
      rulesVersion: oralReviewRulesVersion,
      card: reviewScheduler.review(questionId, card, rating.value, answeredAt),
    })
  }
})

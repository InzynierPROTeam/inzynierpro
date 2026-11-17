import { DateTime, Option } from 'effect'
import {
  againRating,
  goodRating,
  hardRating,
  type ReviewRating,
} from '~api/modules/learning/domain/review-state.model.js'
import {
  type AssistanceLevel,
  explanationAssistance,
  noAssistance,
  noteAssistance,
} from '~api/modules/written-study/domain/review-state.model.js'

export const answerAssistance = (opened: {
  readonly explanationOpenedAt: Option.Option<DateTime.Utc>
  readonly noteOpenedAt: Option.Option<DateTime.Utc>
}): AssistanceLevel => {
  if (Option.isSome(opened.explanationOpenedAt)) {
    return explanationAssistance
  }

  return Option.isSome(opened.noteOpenedAt) ? noteAssistance : noAssistance
}

export const writtenReviewRating = (answer: {
  readonly isCorrect: boolean
  readonly assistance: AssistanceLevel
  readonly isNewCard: boolean
  readonly isFirstAnswerOfStudyDay: boolean
  readonly answersCurrentContent: boolean
}): Option.Option<ReviewRating> => {
  if (!answer.answersCurrentContent) {
    return Option.none()
  }

  if (!answer.isCorrect) {
    return Option.some(againRating)
  }

  if (!answer.isFirstAnswerOfStudyDay) {
    return Option.none()
  }

  switch (answer.assistance) {
    case noAssistance:
      return Option.some(goodRating)
    case explanationAssistance:
      return answer.isNewCard ? Option.some(againRating) : Option.none()
    default:
      return Option.some(hardRating)
  }
}

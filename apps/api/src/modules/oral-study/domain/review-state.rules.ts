import type { OralSelfAssessment } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Option } from 'effect'
import {
  againRating,
  goodRating,
  hardRating,
  type ReviewRating,
} from '~api/modules/learning/domain/review-state.model.js'

export const oralReviewRating = (answer: {
  readonly selfAssessment: OralSelfAssessment
  readonly isFirstAnswerOfStudyDay: boolean
  readonly answersCurrentContent: boolean
}): Option.Option<ReviewRating> => {
  if (!answer.answersCurrentContent) {
    return Option.none()
  }

  if (answer.selfAssessment === 'hard') {
    return Option.some(againRating)
  }

  if (!answer.isFirstAnswerOfStudyDay) {
    return Option.none()
  }

  return Option.some(answer.selfAssessment === 'medium' ? hardRating : goodRating)
}

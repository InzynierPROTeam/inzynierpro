import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import { DateTime, Option } from 'effect'

import {
  againRating,
  type AssistanceLevel,
  explanationAssistance,
  goodRating,
  hardRating,
  noAssistance,
  noteAssistance,
  type ReviewRating,
  type StudyDay,
} from './review-state.model.js'

const studyDayZone = DateTime.zoneMakeNamedUnsafe(POLAND_TIME_ZONE)

/** The Europe/Warsaw study day an instant falls on, by backend time (ADR-0010). */
export const studyDayOf = (at: DateTime.Utc): StudyDay => {
  const start = DateTime.startOf(DateTime.setZone(at, studyDayZone), 'day')

  return {
    start: DateTime.toUtc(start),
    end: DateTime.toUtc(DateTime.add(start, { days: 1 })),
  }
}

export const answerAssistance = (opened: {
  readonly explanationOpenedAt: Option.Option<DateTime.Utc>
  readonly noteOpenedAt: Option.Option<DateTime.Utc>
}): AssistanceLevel => {
  if (Option.isSome(opened.explanationOpenedAt)) {
    return explanationAssistance
  }

  return Option.isSome(opened.noteOpenedAt) ? noteAssistance : noAssistance
}

/**
 * Replaced content says nothing about the current card. Explanation-assisted answers schedule
 * an independent check for new cards without extending an existing card's interval (ADR-0005).
 */
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

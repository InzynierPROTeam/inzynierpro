import { type Percent, ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import {
  activeStudySession,
  endedStudySession,
  scoredQuestionCount,
  type StudySessionStatus,
} from '@inzpro/domain/modules/study/study-session'
import { Option } from 'effect'

import type { StudySession, StudySessionResultCounts } from './study-session.model.js'

export const studySessionStatus = (session: Pick<StudySession, 'endedAt'>): StudySessionStatus =>
  Option.isSome(session.endedAt) ? endedStudySession : activeStudySession

/** The share of the session's scored questions already answered, rounded like V1. */
export const answeredPercent = (
  session: Pick<StudySession, 'answeredCount' | 'questionCount' | 'skippedCount'>,
): Percent =>
  ratioToPercent(
    calculateCompletionRatio(
      session.answeredCount,
      scoredQuestionCount({ total: session.questionCount, skipped: session.skippedCount }),
    ),
  )

/**
 * The session's score: correct answers among its scored questions, so unanswered questions count
 * against it as in the summary's ring, while skipped withdrawn ones do not (ADR-0003).
 */
export const correctPercent = (
  result: Pick<StudySessionResultCounts, 'correct'>,
  session: Pick<StudySession, 'questionCount' | 'skippedCount'>,
): Percent =>
  ratioToPercent(
    calculateCompletionRatio(
      result.correct,
      scoredQuestionCount({ total: session.questionCount, skipped: session.skippedCount }),
    ),
  )

// The mode recorded on a regular-study LearningEvent; reviews and favourites will add their own (ADR-0005).
export const studyLearningMode = 'study'

import { type Percent, ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  activeStudySession,
  endedStudySession,
  type StudySessionStatus,
} from '@inzpro/domain/modules/study/study-session'
import { Option } from 'effect'

import type { StudySession, StudySessionResultCounts } from './study-session.model.js'

export const studySessionStatus = (session: Pick<StudySession, 'endedAt'>): StudySessionStatus =>
  Option.isSome(session.endedAt) ? endedStudySession : activeStudySession

/** The share of the session's questions already answered, rounded like V1. */
export const answeredPercent = (
  session: Pick<StudySession, 'answeredCount' | 'questionCount'>,
): Percent => ratioToPercent(calculateCompletionRatio(session.answeredCount, session.questionCount))

/**
 * The session's score: correct answers among all of its questions, so unanswered questions count
 * against it as in the summary's ring.
 */
export const correctPercent = (
  result: Pick<StudySessionResultCounts, 'correct'>,
  questionCount: QuestionCount,
): Percent => ratioToPercent(calculateCompletionRatio(result.correct, questionCount))

// The mode recorded on a regular-study LearningEvent; reviews and favourites will add their own (ADR-0005).
export const studyLearningMode = 'study'

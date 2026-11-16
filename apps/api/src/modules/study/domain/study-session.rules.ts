import { type Percent, ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import {
  activeStudySession,
  endedStudySession,
  scoredQuestionCount,
  type StudySessionStatus,
} from '@inzpro/domain/modules/study/study-session'
import { Effect, Option, Random } from 'effect'

import type {
  SessionCandidate,
  StudySession,
  StudySessionResultCounts,
} from './study-session.model.js'

export const studySessionStatus = (session: Pick<StudySession, 'endedAt'>): StudySessionStatus =>
  Option.isSome(session.endedAt) ? endedStudySession : activeStudySession

export const answeredPercent = (
  session: Pick<StudySession, 'answeredCount' | 'questionCount' | 'skippedCount'>,
): Percent =>
  ratioToPercent(
    calculateCompletionRatio(
      session.answeredCount,
      scoredQuestionCount({ total: session.questionCount, skipped: session.skippedCount }),
    ),
  )

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

export const shuffleAnswerOrders = (candidates: ReadonlyArray<SessionCandidate>) =>
  Effect.forEach(candidates, candidate =>
    Effect.map(Random.shuffle(candidate.answerIds), answerIds => ({ ...candidate, answerIds })),
  )

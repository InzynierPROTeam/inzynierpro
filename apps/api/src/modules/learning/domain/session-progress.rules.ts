import { type Percent, ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  activeStudySession,
  endedStudySession,
  scoredQuestionCount,
  type StudySessionStatus,
} from '@inzpro/domain/modules/learning/study-session'
import { Option } from 'effect'
import type { DateTime } from 'effect'

export const studySessionStatus = (session: {
  readonly endedAt: Option.Option<DateTime.Utc>
}): StudySessionStatus => (Option.isSome(session.endedAt) ? endedStudySession : activeStudySession)

export const answeredPercent = (session: {
  readonly answeredCount: QuestionCount
  readonly questionCount: QuestionCount
  readonly skippedCount: QuestionCount
}): Percent =>
  ratioToPercent(
    calculateCompletionRatio(
      session.answeredCount,
      scoredQuestionCount({ total: session.questionCount, skipped: session.skippedCount }),
    ),
  )

export const correctPercent = (
  result: { readonly correct: number },
  session: { readonly questionCount: QuestionCount; readonly skippedCount: QuestionCount },
): Percent =>
  ratioToPercent(
    calculateCompletionRatio(
      result.correct,
      scoredQuestionCount({ total: session.questionCount, skipped: session.skippedCount }),
    ),
  )

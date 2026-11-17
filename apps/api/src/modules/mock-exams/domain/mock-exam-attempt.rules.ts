import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'
import type {
  AttemptScoreCounts,
  AttemptTiming,
  MockExamResult,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export const scoreAttempt = (
  counts: AttemptScoreCounts,
  timing: AttemptTiming,
): MockExamResult => ({
  correct: counts.correct,
  incorrect: QuestionCount.make(counts.total - counts.correct),
  unanswered: counts.unanswered,
  percent: ratioToPercent(calculateCompletionRatio(counts.correct, counts.total)),
  passed:
    counts.withdrawn > 0 ? Option.none() : Option.some(counts.correct >= counts.passThreshold),
  activeSeconds: timing.activeSeconds,
  pauseCount: timing.pauseCount,
  pauseSeconds: timing.pauseSeconds,
  sections: counts.sections,
})

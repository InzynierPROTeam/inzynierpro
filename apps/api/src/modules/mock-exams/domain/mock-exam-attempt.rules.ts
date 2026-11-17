import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  ExamActiveSeconds,
  ExamPauseCount,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Option } from 'effect'
import type {
  AttemptScoreCounts,
  MockExamResult,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export const scoreAttempt = (
  counts: AttemptScoreCounts,
  activeSeconds: ExamActiveSeconds,
): MockExamResult => ({
  correct: counts.correct,
  incorrect: QuestionCount.make(counts.total - counts.correct),
  unanswered: counts.unanswered,
  percent: ratioToPercent(calculateCompletionRatio(counts.correct, counts.total)),
  passed:
    counts.withdrawn > 0 ? Option.none() : Option.some(counts.correct >= counts.passThreshold),
  activeSeconds,
  pauseCount: ExamPauseCount.make(0),
  pauseSeconds: ExamActiveSeconds.make(0),
  sections: counts.sections,
})

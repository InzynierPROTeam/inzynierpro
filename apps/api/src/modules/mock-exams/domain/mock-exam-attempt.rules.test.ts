import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  ExamSectionName,
  ExamSectionPosition,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import {
  ExamActiveSeconds,
  ExamPauseCount,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Option } from 'effect'
import { describe, expect, it } from 'vitest'
import type { AttemptScoreCounts } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import { scoreAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.rules.js'

const counts = (
  correct: number,
  total = 10,
  unanswered = 0,
  withdrawn = 0,
): AttemptScoreCounts => ({
  total: QuestionCount.make(total),
  correct: QuestionCount.make(correct),
  unanswered: QuestionCount.make(unanswered),
  withdrawn: QuestionCount.make(withdrawn),
  passThreshold: QuestionCount.make(6),
  sections: [
    {
      position: ExamSectionPosition.make(1),
      name: ExamSectionName.make('Test section'),
      questionCount: QuestionCount.make(total),
      correct: QuestionCount.make(correct),
    },
  ],
})

const timing = {
  activeSeconds: ExamActiveSeconds.make(180),
  pauseCount: ExamPauseCount.make(2),
  pauseSeconds: ExamActiveSeconds.make(75),
}

describe('mock exam scoring', () => {
  it('passes at the exact threshold and fails immediately below it', () => {
    expect(scoreAttempt(counts(6), timing)).toMatchObject({
      correct: 6,
      incorrect: 4,
      percent: 60,
      passed: Option.some(true),
      activeSeconds: 180,
      pauseCount: 2,
      pauseSeconds: 75,
    })
    expect(scoreAttempt(counts(5), timing).passed).toStrictEqual(Option.some(false))
  })
  it('counts unanswered questions as wrong and preserves section counts', () => {
    expect(scoreAttempt(counts(6, 10, 4), timing)).toMatchObject({
      correct: 6,
      incorrect: 4,
      unanswered: 4,
      sections: [{ correct: 6, questionCount: 10 }],
    })
    expect(scoreAttempt(counts(0, 10, 10), timing)).toMatchObject({
      correct: 0,
      incorrect: 10,
      unanswered: 10,
      percent: 0,
      passed: Option.some(false),
    })
  })
  it('rounds partial percentages through the shared completion rule', () => {
    expect(scoreAttempt(counts(1, 3), timing).percent).toBe(33)
    expect(scoreAttempt(counts(2, 3), timing).percent).toBe(67)
    expect(scoreAttempt(counts(0, 0), timing).percent).toBe(0)
  })
  it('keeps valid scores but suppresses pass or fail when any question was withdrawn', () => {
    expect(scoreAttempt(counts(6, 10, 1, 1), timing)).toMatchObject({
      correct: 6,
      percent: 60,
      passed: Option.none(),
      sections: [{ correct: 6 }],
    })
  })
})

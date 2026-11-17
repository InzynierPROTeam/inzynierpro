import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { ExamSectionPosition } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Effect, Exit, Random } from 'effect'
import { describe, expect, it } from 'vitest'
import { MockExamUnavailable } from '~api/modules/mock-exams/domain/errors.js'
import type { ExamCandidate } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import {
  drawExamQuestions,
  shuffleAnswerOptions,
} from '~api/modules/mock-exams/domain/mock-exam-draw.rules.js'

const uuid = (prefix: string, index: number) =>
  `${prefix}000000-0000-4000-8000-${String(index).padStart(12, '0')}`

const candidate = (section: number, question: number): ExamCandidate => ({
  section: ExamSectionPosition.make(section),
  questionId: WrittenQuestionId.make(uuid('30', question)),
  questionRevisionId: QuestionRevisionId.make(uuid('43', question)),
})

const sectionOf = (position: number, questionCount: number) => ({
  position: ExamSectionPosition.make(position),
  questionCount: QuestionCount.make(questionCount),
})

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

const draw = (
  sections: ReadonlyArray<ReturnType<typeof sectionOf>>,
  candidates: ReadonlyArray<ExamCandidate>,
  seed = 'mock-exam',
) => Effect.runSyncExit(drawExamQuestions(sections, candidates).pipe(Random.withSeed(seed)))

const drawn = (exit: Exit.Exit<ReadonlyArray<ExamCandidate>, MockExamUnavailable>) => {
  if (Exit.isFailure(exit)) {
    throw new Error('Expected a draw')
  }

  return exit.value
}

describe('mock exam draw', () => {
  const twoDocuments = [
    ...range(1, 8).map(n => candidate(1, n)),
    ...range(9, 16).map(n => candidate(2, n)),
  ]

  it('draws each section count from its own candidates, sections in blueprint order', () => {
    const questions = drawn(draw([sectionOf(1, 5), sectionOf(2, 5)], twoDocuments))

    expect(questions.map(question => question.section)).toStrictEqual([
      1, 1, 1, 1, 1, 2, 2, 2, 2, 2,
    ])
    expect(
      questions
        .filter(question => question.section === 1)
        .every(question =>
          range(1, 8)
            .map(n => uuid('30', n))
            .includes(question.questionId),
        ),
    ).toBe(true)
    expect(
      questions
        .filter(question => question.section === 2)
        .every(question =>
          range(9, 16)
            .map(n => uuid('30', n))
            .includes(question.questionId),
        ),
    ).toBe(true)
  })

  it('chooses different questions for different random draws', () => {
    const draws = ['first', 'second', 'third', 'fourth'].map(seed =>
      drawn(draw([sectionOf(1, 5), sectionOf(2, 5)], twoDocuments, seed))
        .map(question => question.questionId)
        .join(),
    )

    expect(new Set(draws).size).toBeGreaterThan(1)
  })

  it('refuses the draw when a section has too few eligible questions', () =>
    expect(draw([sectionOf(1, 5), sectionOf(2, 9)], twoDocuments)).toStrictEqual(
      Exit.fail(new MockExamUnavailable({ reason: 'too-few-questions' })),
    ))

  it('shuffles the options of each question while keeping all of them', () => {
    const answerIds = range(1, 3).map(n => QuestionAnswerId.make(uuid('44', n)))

    const orders = ['a', 'b', 'c', 'd', 'e'].map(seed =>
      Effect.runSync(
        shuffleAnswerOptions([{ ...candidate(1, 1), answerIds }]).pipe(Random.withSeed(seed)),
      ),
    )

    for (const [question] of orders) {
      expect([...(question?.answerIds ?? [])].sort()).toStrictEqual(answerIds)
    }

    expect(new Set(orders.map(([question]) => question?.answerIds.join())).size).toBeGreaterThan(1)
  })
})

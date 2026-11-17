import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  type ExamSectionPosition,
  tooFewExamQuestions,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Effect, Random } from 'effect'
import { MockExamUnavailable } from '~api/modules/mock-exams/domain/errors.js'
import type {
  DrawnQuestion,
  ExamCandidate,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export const drawExamQuestions = Effect.fnUntraced(function* (
  sections: ReadonlyArray<{
    readonly position: ExamSectionPosition
    readonly questionCount: QuestionCount
  }>,
  candidates: ReadonlyArray<ExamCandidate>,
) {
  const drawn: Array<ExamCandidate> = []

  for (const section of sections) {
    const eligible = candidates.filter(candidate => candidate.section === section.position)

    if (eligible.length < section.questionCount) {
      return yield* new MockExamUnavailable({ reason: tooFewExamQuestions })
    }

    const shuffled = yield* Random.shuffle(eligible)
    drawn.push(...shuffled.slice(0, section.questionCount))
  }

  return drawn
})

export const shuffleAnswerOptions = (questions: ReadonlyArray<DrawnQuestion>) =>
  Effect.forEach(questions, question =>
    Effect.map(Random.shuffle(question.answerIds), answerIds => ({ ...question, answerIds })),
  )

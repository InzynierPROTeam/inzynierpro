import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'
import {
  currentLearningRound,
  isNewLearningRound,
} from '~api/modules/learning/domain/learning-round.rules.js'

const count = Schema.decodeSync(QuestionCount)

const round = Schema.decodeSync(LearningRoundNumber)

const progress = (stored: number, questions: number, covered: number) => ({
  round: round(stored),
  questionCount: count(questions),
  coveredQuestionCount: count(covered),
})

describe('the current learning round', () => {
  it('stays while a question of the path is uncovered in it', () =>
    expect(currentLearningRound(progress(1, 3, 2))).toBe(1))

  it('is the next one once every question is covered in the stored round', () =>
    expect(currentLearningRound(progress(2, 3, 3))).toBe(3))

  it('never completes on a path without questions', () =>
    expect(currentLearningRound(progress(1, 0, 0))).toBe(1))
})

describe('a new learning round', () => {
  it('starts once the stored round is complete', () =>
    expect(isNewLearningRound(progress(1, 3, 3))).toBe(true))

  it('stays new after the first round until a question is covered in it', () => {
    expect(isNewLearningRound(progress(2, 3, 0))).toBe(true)
    expect(isNewLearningRound(progress(2, 3, 1))).toBe(false)
  })

  it('does not apply to the first round', () =>
    expect(isNewLearningRound(progress(1, 3, 0))).toBe(false))
})

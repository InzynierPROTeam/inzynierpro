import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'

import type { AssistanceLevel } from './review-state.model.js'

const writtenAwards = {
  base: 1,
  independentCorrect: 2,
  noteCorrect: 1,
  explanationCorrect: 0,
  dueReview: 1,
} as const

export const writtenAnswerXp = (answer: {
  readonly isCorrect: boolean
  readonly assistance: AssistanceLevel
  readonly isDueReview: boolean
}) =>
  LearningXp.make(
    writtenAwards.base +
      (answer.isCorrect
        ? {
            none: writtenAwards.independentCorrect,
            note: writtenAwards.noteCorrect,
            explanation: writtenAwards.explanationCorrect,
          }[answer.assistance]
        : 0) +
      (answer.isDueReview ? writtenAwards.dueReview : 0),
  )

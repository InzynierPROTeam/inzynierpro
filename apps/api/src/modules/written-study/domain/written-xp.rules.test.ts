import { expect, test } from 'vitest'

import { explanationAssistance, noAssistance, noteAssistance } from './review-state.model.js'
import { writtenAnswerXp } from './written-xp.rules.js'

test.each([
  { isCorrect: true, assistance: noAssistance, isDueReview: false, expected: 3 },
  { isCorrect: true, assistance: noteAssistance, isDueReview: false, expected: 2 },
  { isCorrect: true, assistance: explanationAssistance, isDueReview: false, expected: 1 },
  { isCorrect: false, assistance: noAssistance, isDueReview: false, expected: 1 },
  { isCorrect: false, assistance: noteAssistance, isDueReview: false, expected: 1 },
  { isCorrect: false, assistance: explanationAssistance, isDueReview: false, expected: 1 },
  { isCorrect: true, assistance: noAssistance, isDueReview: true, expected: 4 },
  { isCorrect: true, assistance: noteAssistance, isDueReview: true, expected: 3 },
  { isCorrect: true, assistance: explanationAssistance, isDueReview: true, expected: 2 },
  { isCorrect: false, assistance: noAssistance, isDueReview: true, expected: 2 },
  { isCorrect: false, assistance: noteAssistance, isDueReview: true, expected: 2 },
  { isCorrect: false, assistance: explanationAssistance, isDueReview: true, expected: 2 },
] as const)(
  'awards $expected XP for correctness $isCorrect, assistance $assistance and due review $isDueReview',
  ({ expected, ...answer }) => {
    expect(writtenAnswerXp(answer)).toBe(expected)
  },
)

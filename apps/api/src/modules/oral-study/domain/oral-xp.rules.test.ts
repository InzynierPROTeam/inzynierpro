import { expect, test } from 'vitest'

import { oralSelfAssessmentXp, quizCheckXp } from './oral-xp.rules.js'

test('an oral self-assessment earns two XP without a correctness bonus', () => {
  expect(oralSelfAssessmentXp).toBe(2)
})

test.each([
  { isCorrect: false, expected: 1 },
  { isCorrect: true, expected: 2 },
])('a quiz check with correctness $isCorrect earns $expected XP', ({ isCorrect, expected }) => {
  expect(quizCheckXp(isCorrect)).toBe(expected)
})

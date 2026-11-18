import { expect, test } from 'vitest'

import { finalExamAnswerXp, finishedExamXp } from './mock-exam-xp.rules.js'

test.each([
  { isCorrect: false, expected: 1 },
  { isCorrect: true, expected: 2 },
])(
  'a final exam answer with correctness $isCorrect earns $expected XP',
  ({ isCorrect, expected }) => {
    expect(finalExamAnswerXp(isCorrect)).toBe(expected)
  },
)

test.each([
  { passed: false, expected: 10 },
  { passed: true, expected: 20 },
])('a finished exam with pass status $passed earns $expected XP', ({ passed, expected }) => {
  expect(finishedExamXp(passed)).toBe(expected)
})

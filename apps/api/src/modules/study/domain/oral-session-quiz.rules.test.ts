import { Effect, Option, Random } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  drawKnowledgeChecks,
  isAllowedSelection,
  isCorrectSelection,
  knowledgeCheckReviewRating,
} from './oral-session-quiz.rules.js'

const check = (questionId: string, id: string) => ({ questionId, id })

const draw = (candidates: ReadonlyArray<ReturnType<typeof check>>, limit: number, seed: string) =>
  Effect.runSync(drawKnowledgeChecks(candidates, limit).pipe(Random.withSeed(seed)))

describe('knowledge check draw', () => {
  it('covers different session questions before repeating one', () => {
    const candidates = [
      check('q1', 'a'),
      check('q1', 'b'),
      check('q1', 'c'),
      check('q2', 'd'),
      check('q3', 'e'),
    ]

    for (const seed of ['one', 'two', 'three', 'four']) {
      const drawn = draw(candidates, 3, seed)

      expect(new Set(drawn.map(c => c.questionId))).toEqual(new Set(['q1', 'q2', 'q3']))
    }
  })

  it('fills the limit with further checks of covered questions when too few questions have checks', () => {
    const drawn = draw([check('q1', 'a'), check('q1', 'b'), check('q2', 'c')], 5, 'seed')

    expect(drawn.map(c => c.id).toSorted()).toEqual(['a', 'b', 'c'])
    expect(new Set(drawn.slice(0, 2).map(c => c.questionId))).toEqual(new Set(['q1', 'q2']))
  })

  it('never draws more than the limit', () => {
    const candidates = Array.from({ length: 8 }, (_, index) => check(`q${index}`, `c${index}`))

    expect(draw(candidates, 5, 'seed')).toHaveLength(5)
  })

  it('draws at random', () => {
    const candidates = Array.from({ length: 8 }, (_, index) => check(`q${index}`, `c${index}`))

    const draws = new Set(
      ['a', 'b', 'c', 'd', 'e'].map(seed =>
        draw(candidates, 5, seed)
          .map(c => c.id)
          .join(),
      ),
    )

    expect(draws.size).toBeGreaterThan(1)
  })
})

const options = [
  { id: 'a', isCorrect: true },
  { id: 'b', isCorrect: false },
  { id: 'c', isCorrect: true },
]

describe('knowledge check scoring', () => {
  it.each([
    [['a', 'c'], true],
    [['a'], false],
    [['a', 'b', 'c'], false],
    [['b'], false],
  ])('selecting %j is correct: %s', (selected, isCorrect) =>
    expect(isCorrectSelection(options, selected)).toBe(isCorrect),
  )
})

describe('knowledge check selection', () => {
  it.each([
    ['multiple_choice', ['a', 'c'], true],
    ['multiple_choice', [], false],
    ['multiple_choice', ['a', 'a'], false],
    ['multiple_choice', ['z'], false],
    ['single_choice', ['b'], true],
    ['single_choice', ['a', 'b'], false],
    ['true_false', ['a'], true],
    ['true_false', ['a', 'b'], false],
  ] as const)('a %s answer with %j is valid: %s', (format, selected, isValid) =>
    expect(isAllowedSelection(format, options, selected)).toBe(isValid),
  )
})

describe('knowledge check review rating', () => {
  it('applies Again to the linked oral question after a wrong answer', () =>
    expect(knowledgeCheckReviewRating({ isCorrect: false, answersCurrentContent: true })).toEqual(
      Option.some('again'),
    ))

  it('changes nothing after a correct answer', () =>
    expect(knowledgeCheckReviewRating({ isCorrect: true, answersCurrentContent: true })).toEqual(
      Option.none(),
    ))

  it('changes nothing when the session pinned replaced substantive content', () =>
    expect(knowledgeCheckReviewRating({ isCorrect: false, answersCurrentContent: false })).toEqual(
      Option.none(),
    ))
})

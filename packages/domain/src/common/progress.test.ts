import { describe, expect, it } from 'vitest'

import { ratioToPercent } from './percent.js'
import { calculateCompletionRatio } from './progress.js'

describe('completion ratio', () => {
  it.each([
    [0, 3, 0],
    [3, 3, 1],
    [1, 4, 0.25],
    [5, 3, 1],
    [-1, 3, 0],
    [0, 0, 0],
  ])('%i of %i completed is %d', (completed, total, ratio) =>
    expect(calculateCompletionRatio(completed, total)).toBe(ratio),
  )
})

describe('ratio to percent', () => {
  it.each([
    [0, 0],
    [1, 100],
    [2 / 3, 67],
    [1 / 3, 33],
  ])('%d is %i%%', (ratio, percent) =>
    expect(ratioToPercent(calculateCompletionRatio(ratio * 3, 3))).toBe(percent),
  )
})

import { DateTime, Option } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  explanationAssistance,
  noAssistance,
  noteAssistance,
  type AssistanceLevel,
} from './review-state.model.js'
import { answerAssistance, studyDayOf, writtenReviewRating } from './review-state.rules.js'

const rating = (
  isCorrect: boolean,
  assistance: AssistanceLevel,
  isNewCard: boolean,
  isFirstAnswerOfStudyDay = true,
  answersCurrentContent = true,
) =>
  writtenReviewRating({
    isCorrect,
    assistance,
    isNewCard,
    isFirstAnswerOfStudyDay,
    answersCurrentContent,
  })

describe('answerAssistance', () => {
  const openedAt = Option.some(DateTime.makeUnsafe('2026-11-13T11:00:00.000Z'))

  it('is none when nothing was opened', () => {
    expect(
      answerAssistance({ explanationOpenedAt: Option.none(), noteOpenedAt: Option.none() }),
    ).toBe(noAssistance)
  })

  it('is note when only the note was opened', () => {
    expect(answerAssistance({ explanationOpenedAt: Option.none(), noteOpenedAt: openedAt })).toBe(
      noteAssistance,
    )
  })

  it('is explanation when the explanation was opened, even with the note', () => {
    expect(answerAssistance({ explanationOpenedAt: openedAt, noteOpenedAt: Option.none() })).toBe(
      explanationAssistance,
    )
    expect(answerAssistance({ explanationOpenedAt: openedAt, noteOpenedAt: openedAt })).toBe(
      explanationAssistance,
    )
  })
})

describe('writtenReviewRating', () => {
  it('rates an independent correct answer Good', () => {
    expect(rating(true, noAssistance, true)).toEqual(Option.some('good'))
    expect(rating(true, noAssistance, false)).toEqual(Option.some('good'))
  })

  it('rates a correct answer after opening the note Hard', () => {
    expect(rating(true, noteAssistance, true)).toEqual(Option.some('hard'))
    expect(rating(true, noteAssistance, false)).toEqual(Option.some('hard'))
  })

  it('rates a correct answer after the explanation Again for a new card and keeps an existing one', () => {
    expect(rating(true, explanationAssistance, true)).toEqual(Option.some('again'))
    expect(rating(true, explanationAssistance, false)).toEqual(Option.none())
  })

  it('rates a wrong answer Again regardless of assistance', () => {
    for (const assistance of [noAssistance, noteAssistance, explanationAssistance] as const) {
      expect(rating(false, assistance, true)).toEqual(Option.some('again'))
      expect(rating(false, assistance, false)).toEqual(Option.some('again'))
    }
  })

  it('keeps the state for a later correct answer on the same study day', () => {
    expect(rating(true, noAssistance, false, false)).toEqual(Option.none())
    expect(rating(true, noteAssistance, true, false)).toEqual(Option.none())
    expect(rating(true, explanationAssistance, true, false)).toEqual(Option.none())
  })

  it('still applies Again for a later wrong answer on the same study day', () => {
    expect(rating(false, noAssistance, false, false)).toEqual(Option.some('again'))
    expect(rating(false, explanationAssistance, true, false)).toEqual(Option.some('again'))
  })

  it('never rates an answer to content a substantive revision replaced', () => {
    expect(rating(true, noAssistance, true, true, false)).toEqual(Option.none())
    expect(rating(false, noAssistance, false, true, false)).toEqual(Option.none())
    expect(rating(false, explanationAssistance, true, false, false)).toEqual(Option.none())
  })
})

describe('studyDayOf', () => {
  const day = (iso: string) => {
    const { start, end } = studyDayOf(DateTime.makeUnsafe(iso))

    return [DateTime.formatIso(start), DateTime.formatIso(end)]
  }

  it('starts the study day at midnight in Warsaw, not in UTC', () => {
    expect(day('2026-11-13T22:59:00.000Z')).toEqual([
      '2026-11-12T23:00:00.000Z',
      '2026-11-13T23:00:00.000Z',
    ])
    expect(day('2026-11-13T23:00:00.000Z')).toEqual([
      '2026-11-13T23:00:00.000Z',
      '2026-11-14T23:00:00.000Z',
    ])
  })

  it('follows daylight saving time changes', () => {
    expect(day('2026-03-29T12:00:00.000Z')).toEqual([
      '2026-03-28T23:00:00.000Z',
      '2026-03-29T22:00:00.000Z',
    ])
  })
})

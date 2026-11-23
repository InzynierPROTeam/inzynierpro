import { DateTime, Duration } from 'effect'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  addWarsawDays,
  pickedDayToUtcIsoDateTime,
  toPickerDate,
  dateTimeInputToUtc,
  formatDateTimeInput,
  formatDuration,
  formatWarsawIsoDate,
  getCurrentFullYear,
  getDaysUntil,
  getRemainingDuration,
  isDateTimeInput,
  warsawEndOfDay,
  warsawMonthStartOf,
  warsawStartOfDay,
  warsawWeekStartOf,
} from './date.js'

const instant = DateTime.makeUnsafe

afterEach(() => vi.unstubAllEnvs())

describe('Warsaw calendar days', () => {
  it.each(['UTC', 'America/Los_Angeles'])('map a picked day to its Warsaw start in %s', zone => {
    vi.stubEnv('TZ', zone)
    expect(pickedDayToUtcIsoDateTime(toPickerDate('2026-11-23T10:00:00.000Z'))).toBe(
      '2026-11-22T23:00:00.000Z',
    )
    expect(pickedDayToUtcIsoDateTime(toPickerDate('2027-05-14T10:00:00.000Z'))).toBe(
      '2027-05-13T22:00:00.000Z',
    )
  })

  it('step whole Warsaw days across a time change', () =>
    expect(DateTime.formatIso(addWarsawDays('2026-03-29T10:00:00.000Z', -1))).toBe(
      '2026-03-27T23:00:00.000Z',
    ))
})

describe('Warsaw date boundaries', () => {
  it.each(['UTC', 'America/Los_Angeles', 'Asia/Tokyo'])('ignores the device timezone %s', zone => {
    vi.stubEnv('TZ', zone)
    expect(dateTimeInputToUtc('2026-01-15T12:30')).toBe('2026-01-15T11:30:00.000Z')
    expect(dateTimeInputToUtc('2026-07-15T12:30')).toBe('2026-07-15T10:30:00.000Z')
    expect(formatDateTimeInput('2026-07-15T10:30:00.000Z')).toBe('2026-07-15T12:30')
    expect(getCurrentFullYear('2026-12-31T23:30:00.000Z')).toBe(2027)
  })

  it('rejects nonexistent local times and chooses the earlier repeated time', () => {
    expect(isDateTimeInput('2026-03-29T02:30')).toBe(false)
    expect(isDateTimeInput('2026-10-25T02:30')).toBe(true)
    expect(dateTimeInputToUtc('2026-10-25T02:30')).toBe('2026-10-25T00:30:00.000Z')
    expect(isDateTimeInput('garbage')).toBe(false)
    expect(isDateTimeInput('2026-02-30T12:00')).toBe(false)
    expect(isDateTimeInput('')).toBe(true)
    expect(dateTimeInputToUtc('')).toBeNull()
  })

  it.each([
    ['2026-03-29T12:00:00.000Z', 23],
    ['2026-10-25T12:00:00.000Z', 25],
  ])('uses the actual duration of the Warsaw day %s', (input, hours) => {
    const start = warsawStartOfDay(input)
    const next = DateTime.add(warsawEndOfDay(input), { milliseconds: 1 })
    expect(Duration.toHours(DateTime.distance(start, next))).toBe(hours)
  })

  it('counts calendar days across DST and the Warsaw midnight boundary', () => {
    expect(getDaysUntil('2026-03-30T00:00:00.000Z', '2026-03-28T23:30:00.000Z')).toBe(1)
    expect(DateTime.formatIso(warsawStartOfDay('2026-01-01T23:30:00.000Z'))).toBe(
      '2026-01-01T23:00:00.000Z',
    )
    expect(
      getDaysUntil(instant('2026-07-01T22:10:00.000Z'), instant('2026-07-01T21:50:00.000Z')),
    ).toBe(1)
  })

  it('formats elapsed durations without resetting at midnight', () => {
    expect(formatDuration(Duration.hours(25))).toBe('25:00:00')
    expect(formatDuration(Duration.seconds(65))).toBe('00:01:05')
  })

  it('measures the time left until a deadline and never goes below zero', () => {
    expect(
      Duration.toMillis(
        getRemainingDuration('2026-11-13T12:10:00.000Z', '2026-11-13T12:07:30.000Z'),
      ),
    ).toBe(150_000)
    expect(
      Duration.isZero(getRemainingDuration('2026-11-13T12:10:00.000Z', '2026-11-13T12:11:00.000Z')),
    ).toBe(true)
  })
})

describe('Warsaw weeks and months', () => {
  it.each([
    { at: '2026-11-01T22:59:59Z', day: '2026-11-01', week: '2026-10-26', month: '2026-11-01' },
    { at: '2026-11-01T23:00:00Z', day: '2026-11-02', week: '2026-11-02', month: '2026-11-01' },
    { at: '2026-03-29T22:30:00Z', day: '2026-03-30', week: '2026-03-30', month: '2026-03-01' },
    { at: '2026-12-31T23:00:00Z', day: '2027-01-01', week: '2026-12-28', month: '2027-01-01' },
  ])('start on the Warsaw Monday and first of the month for $at', ({ at, day, week, month }) => {
    expect(formatWarsawIsoDate(at)).toBe(day)
    expect(formatWarsawIsoDate(warsawWeekStartOf(at))).toBe(week)
    expect(formatWarsawIsoDate(warsawMonthStartOf(at))).toBe(month)
  })
})

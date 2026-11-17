import { DateTime, Duration } from 'effect'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  dateTimeInputToUtc,
  formatDateTimeInput,
  formatDuration,
  getCurrentFullYear,
  getDaysUntil,
  getRemainingDuration,
  isDateTimeInput,
  warsawEndOfDay,
  warsawStartOfDay,
} from './date.js'

const instant = DateTime.makeUnsafe

afterEach(() => vi.unstubAllEnvs())

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

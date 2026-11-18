import { POLAND_TIME_ZONE, POLISH_LANGUAGE } from '@inzpro/config/localization'
import { dateTimeUtcToUtcIsoDateTime, type UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { DateTime, Duration, Effect, Option } from 'effect'

export type DateInput = DateTime.DateTime | Date | number | string

type TimeParts = {
  hours: number
  minutes: number
  seconds: number
}

const WARSAW_ZONE = DateTime.zoneMakeNamedUnsafe(POLAND_TIME_ZONE)

const toDateTime = (input: DateInput): DateTime.DateTime => DateTime.makeUnsafe(input)

export const toWarsawZoned = (input: DateInput): DateTime.Zoned =>
  toDateTime(input).pipe(DateTime.setZone(WARSAW_ZONE))

const toWarsawDay = (input: DateInput): DateTime.Utc =>
  toWarsawZoned(input).pipe(DateTime.removeTime)

const parseTimeInputValue = (value: string): TimeParts | null => {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? 0)

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null
  }

  return {
    hours,
    minutes,
    seconds,
  }
}

const padTwoDigits = (value: number): string => String(value).padStart(2, '0')

export const getCurrentDate = (): Date => Effect.runSync(DateTime.nowAsDate)

export const getCurrentUtcIsoDateTime = (): UtcIsoDateTime =>
  dateTimeUtcToUtcIsoDateTime(Effect.runSync(DateTime.now))

export const getCurrentFullYear = (date: DateInput = getCurrentDate()): number =>
  toWarsawZoned(date).pipe(DateTime.toParts).year

export const formatDateTime = (
  date: DateInput,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'long',
    timeStyle: 'short',
  },
  locales: string = POLISH_LANGUAGE,
): string => DateTime.format(toWarsawZoned(date), { ...options, locale: locales })

export const formatDate = (
  date: DateInput,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'long',
  },
  locales: string = POLISH_LANGUAGE,
): string => DateTime.format(toWarsawZoned(date), { ...options, locale: locales })

type RelativeDateUnit = 'day' | 'week'

type FormatRelativeDateOptions = Intl.RelativeTimeFormatOptions & {
  unit?: RelativeDateUnit
}

const formatRelativeDateWithoutIntl = (days: number, options: Intl.RelativeTimeFormatOptions) => {
  if (options.numeric === 'auto') {
    if (days === -2) {
      return 'przedwczoraj'
    }

    if (days === -1) {
      return 'wczoraj'
    }

    if (days === 0) {
      return 'dzisiaj'
    }

    if (days === 1) {
      return 'jutro'
    }

    if (days === 2) {
      return 'pojutrze'
    }
  }

  const absoluteDays = Math.abs(days)
  const dayLabel = absoluteDays === 1 ? 'dzień' : 'dni'

  return days < 0 ? `${absoluteDays} ${dayLabel} temu` : `za ${absoluteDays} ${dayLabel}`
}

export const formatRelativeDate = (
  date: DateInput,
  options: FormatRelativeDateOptions = {
    numeric: 'auto',
  },
  now: DateInput = getCurrentDate(),
): string => {
  const { unit = 'day', ...formatOptions } = options
  const currentDay = toWarsawDay(now)
  const targetDay = toWarsawDay(date)
  const distance = DateTime.distance(currentDay, targetDay)
  const value = Math.round(unit === 'week' ? Duration.toWeeks(distance) : Duration.toDays(distance))

  const RelativeTimeFormat = Intl.RelativeTimeFormat

  if (!RelativeTimeFormat) {
    if (unit === 'day') {
      return formatRelativeDateWithoutIntl(value, formatOptions)
    }

    throw new Error('Formatting relative weeks requires Intl.RelativeTimeFormat')
  }

  return new RelativeTimeFormat(POLISH_LANGUAGE, formatOptions).format(value, unit)
}

export const getDaysUntil = (date: DateInput, now: DateInput = getCurrentDate()): number => {
  const currentDay = toWarsawDay(now)
  const targetDay = toWarsawDay(date)

  return Math.round(Duration.toDays(DateTime.distance(currentDay, targetDay)))
}

export const formatDuration = (input: Duration.Input): string => {
  const duration = Duration.fromInputUnsafe(input)
  const parts = Duration.parts(duration)
  const hours = Math.floor(Duration.toHours(duration))

  return `${padTwoDigits(hours)}:${padTwoDigits(parts.minutes)}:${padTwoDigits(parts.seconds)}`
}

export const getRemainingDuration = (
  deadline: DateInput,
  now: DateInput = getCurrentDate(),
): Duration.Duration =>
  Duration.max(DateTime.distance(toDateTime(now), toDateTime(deadline)), Duration.zero)

export const getUtcIsoDateTimeAfter = (duration: Duration.Input): UtcIsoDateTime =>
  dateTimeUtcToUtcIsoDateTime(
    DateTime.addDuration(Effect.runSync(DateTime.now), Duration.fromInputUnsafe(duration)),
  )

export const formatDatePickerLabel = (date: DateInput): string => {
  const { year, month, day } = toWarsawZoned(date).pipe(DateTime.toParts)

  return `${padTwoDigits(day)}-${padTwoDigits(month)}-${year}`
}

export const formatTimeInputValue = (date: DateInput): string => {
  const {
    hour: hours,
    minute: minutes,
    second: seconds,
  } = toWarsawZoned(date).pipe(DateTime.toParts)

  return `${padTwoDigits(hours)}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
}

export const replaceLocalDate = (current: Date, selected: Date): Date => {
  const { hour, minute, second, millisecond } = toWarsawZoned(current).pipe(DateTime.toParts)

  return toWarsawZoned(selected).pipe(
    DateTime.setParts({
      hour,
      minute,
      second,
      millisecond,
    }),
    DateTime.toDateUtc,
  )
}

export const replaceLocalTime = (current: Date, time: string): Date => {
  const parts = parseTimeInputValue(time)

  if (!parts) {
    return current
  }

  return toWarsawZoned(current).pipe(
    DateTime.setParts({
      hour: parts.hours,
      minute: parts.minutes,
      second: parts.seconds,
      millisecond: 0,
    }),
    DateTime.toDateUtc,
  )
}

export const warsawStartOfDay = (date: DateInput): DateTime.Utc =>
  DateTime.toUtc(DateTime.startOf(toWarsawZoned(date), 'day'))

export const warsawEndOfDay = (date: DateInput): DateTime.Utc =>
  DateTime.toUtc(DateTime.endOf(toWarsawZoned(date), 'day'))

export const formatDateTimeInput = (value: DateInput | null | undefined): string =>
  value == null ? '' : DateTime.formatIsoZoned(toWarsawZoned(value)).slice(0, 16)

const parseWarsawDateTimeInput = (value: string) =>
  DateTime.makeZoned(value, {
    timeZone: WARSAW_ZONE,
    adjustForTimeZone: true,
    disambiguation: 'compatible',
  }).pipe(Option.filter(date => formatDateTimeInput(date) === value))

export const dateTimeInputToUtc = (value: string): string | null =>
  value === ''
    ? null
    : Option.match(parseWarsawDateTimeInput(value), {
        onNone: () => value,
        onSome: DateTime.formatIso,
      })

export const isDateTimeInput = (value: string): boolean =>
  value === '' || Option.isSome(parseWarsawDateTimeInput(value))

export const getWarsawMonth = (date: DateInput): number =>
  DateTime.toParts(toWarsawZoned(date)).month

export const toPickerDate = (date: DateInput): Date => DateTime.toDateUtc(toDateTime(date))

export const pickedDayToUtcIsoDateTime = (date: Date): UtcIsoDateTime =>
  dateTimeUtcToUtcIsoDateTime(warsawStartOfDay(date))

export const addWarsawDays = (date: DateInput, days: number): DateTime.Utc =>
  DateTime.toUtc(DateTime.startOf(DateTime.add(toWarsawZoned(date), { days }), 'day'))

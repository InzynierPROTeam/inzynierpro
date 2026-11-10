import { ApiDateTime } from '@inzpro/domain/common/date-time'
import { DateTime, Option, Schema } from 'effect'

export const dateTimeInputToUtc = (value: string) => {
  if (value === '') {
    return null
  }

  const parsed = DateTime.makeZoned(value, {
    timeZone: DateTime.zoneMakeLocal(),
    adjustForTimeZone: true,
  })

  return Option.match(parsed, { onNone: () => value, onSome: DateTime.formatIso })
}

export const formatDateTimeInput = (value: Option.Option<ApiDateTime>) =>
  Option.match(value, {
    onNone: () => '',
    onSome: date =>
      DateTime.formatIsoZoned(DateTime.setZone(date, DateTime.zoneMakeLocal())).slice(0, 16),
  })

export const formatLocalDateTime = (date: ApiDateTime) =>
  DateTime.format(DateTime.setZone(date, DateTime.zoneMakeLocal()), {
    locale: 'pl-PL',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export const isDateTimeInput = (value: string) => {
  if (value === '') {
    return true
  }

  const date = Schema.decodeUnknownOption(ApiDateTime)(dateTimeInputToUtc(value))

  return Option.isSome(date) && formatDateTimeInput(date) === value
}

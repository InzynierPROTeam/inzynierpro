import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import { DateTime } from 'effect'
import { type StudyDay } from '~api/modules/learning/domain/review-state.model.js'

const studyDayZone = DateTime.zoneMakeNamedUnsafe(POLAND_TIME_ZONE)

export const studyDayOf = (at: DateTime.Utc): StudyDay => {
  const start = DateTime.startOf(DateTime.setZone(at, studyDayZone), 'day')

  return {
    start: DateTime.toUtc(start),
    end: DateTime.toUtc(DateTime.add(start, { days: 1 })),
  }
}

import { addWarsawDays, warsawStartOfDay } from '@inzpro/utils/date'
import { type DateTime } from 'effect'
import { type StudyDay } from '~api/modules/learning/domain/review-state.model.js'

export const studyDayOf = (at: DateTime.Utc): StudyDay => ({
  start: warsawStartOfDay(at),
  end: addWarsawDays(at, 1),
})

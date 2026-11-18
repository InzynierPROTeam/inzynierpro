import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import { DateTime } from 'effect'

import {
  allTimeXpPeriod,
  examSessionXp,
  monthlyXp,
  weeklyXp,
  type XpAward,
  type XpPeriod,
} from './learning-xp.model.js'

export const xpStudyDate = (at: DateTime.Utc) =>
  DateTime.formatIsoDate(DateTime.setZone(at, DateTime.zoneMakeNamedUnsafe(POLAND_TIME_ZONE)))

export const xpPeriodsOf = (
  award: Pick<XpAward, 'awardedAt' | 'examSessionId'>,
): ReadonlyArray<XpPeriod> => {
  const local = DateTime.setZone(award.awardedAt, DateTime.zoneMakeNamedUnsafe(POLAND_TIME_ZONE))

  return [
    {
      kind: weeklyXp,
      key: DateTime.formatIsoDate(DateTime.startOf(local, 'week', { weekStartsOn: 1 })),
    },
    { kind: monthlyXp, key: DateTime.formatIsoDate(DateTime.startOf(local, 'month')) },
    { kind: examSessionXp, key: award.examSessionId },
    allTimeXpPeriod,
  ]
}

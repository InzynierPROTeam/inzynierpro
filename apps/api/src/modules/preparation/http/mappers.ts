import type {
  CompleteOnboardingPayload,
  ChangeGoalPayload,
} from '@inzpro/api-contracts/modules/preparation/requests'
import type {
  UserExamGoal as UserExamGoalDto,
  UserQualificationPath as UserQualificationPathDto,
} from '@inzpro/api-contracts/modules/preparation/responses'
import {
  dateTimeUtcToUtcIsoDateTime,
  type UtcIsoDateTime,
  utcIsoDateTimeToDateTimeUtc,
} from '@inzpro/domain/common/date-time'
import { type DateTime, Option } from 'effect'
import type {
  GoalChange,
  PathConfiguration,
  UserExamGoal,
  UserQualificationPath,
} from '~api/modules/preparation/domain/preparation.model.js'
import { toSpecializationDto } from '~api/modules/qualification-paths/http/mappers.js'

const toOptionalDate = (value: UtcIsoDateTime | null): Option.Option<DateTime.Utc> =>
  Option.map(Option.fromNullishOr(value), utcIsoDateTimeToDateTimeUtc)

const toNullableIso = (value: Option.Option<DateTime.Utc>): UtcIsoDateTime | null =>
  Option.match(value, { onNone: () => null, onSome: dateTimeUtcToUtcIsoDateTime })

export const toPathConfiguration = (payload: CompleteOnboardingPayload): PathConfiguration => ({
  ...payload,
  oralExamDate: toOptionalDate(payload.oralExamDate),
})

export const toGoalChange = (payload: ChangeGoalPayload): GoalChange => ({
  ...payload,
  oralExamDate: toOptionalDate(payload.oralExamDate),
})

export const toUserExamGoalDto = (goal: UserExamGoal): UserExamGoalDto => ({
  ...goal,
  writtenAt: dateTimeUtcToUtcIsoDateTime(goal.writtenAt),
  oralPlanningAt: dateTimeUtcToUtcIsoDateTime(goal.oralPlanningAt),
  oralExamDate: toNullableIso(goal.oralExamDate),
})

export const toUserQualificationPathDto = (
  path: UserQualificationPath,
): UserQualificationPathDto => ({
  ...path,
  specialization: toSpecializationDto(path.specialization),
  districtChamber: Option.getOrNull(path.districtChamber),
  goal: toUserExamGoalDto(path.goal),
})

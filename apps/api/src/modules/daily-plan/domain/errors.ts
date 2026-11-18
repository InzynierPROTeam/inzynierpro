import { Data } from 'effect'

export class StaleDailyPlanSettings extends Data.TaggedError('StaleDailyPlanSettings') {}

export class InvalidPlanPreference extends Data.TaggedError('InvalidPlanPreference') {}

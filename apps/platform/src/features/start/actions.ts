import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  changeOralDailyPlanSettings,
  type ChangeOralDailyPlanSettingsRequest,
} from '@inzpro/api-client/modules/oral-study'
import {
  changeDailyPlanSettings,
  type ChangeDailyPlanSettingsRequest,
} from '@inzpro/api-client/modules/written-study'
import { apiHttpClient } from '~platform/lib/api-client'

export const changeWrittenPlanSettings = (req: ChangeDailyPlanSettingsRequest) =>
  runApi(changeDailyPlanSettings(req), apiHttpClient)

export const changeOralPlanSettings = (req: ChangeOralDailyPlanSettingsRequest) =>
  runApi(changeOralDailyPlanSettings(req), apiHttpClient)

import { runApi } from '@inzpro/api-client/lib/run-api'
import { changeGoal, type ChangeGoalRequest } from '@inzpro/api-client/modules/preparation'
import { apiHttpClient } from '~platform/lib/api-client'

export const saveGoal = (req: ChangeGoalRequest) => runApi(changeGoal(req), apiHttpClient)

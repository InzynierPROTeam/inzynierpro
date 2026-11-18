import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction } from '~api/lib/transaction.js'
import {
  dailyPlanSettingsConflict,
  invalidDailyPlanSettings,
} from '~api/modules/daily-plan/http/errors.js'
import { toDailyPlanDto, toPlanPreference } from '~api/modules/daily-plan/http/mappers.js'
import { failStudyRead, failStudyWrite } from '~api/modules/learning/http/errors.js'
import { changeOralDailyPlanSettings } from '~api/modules/oral-study/application/change-oral-daily-plan-settings.command.js'
import { openOralDailyPlan } from '~api/modules/oral-study/application/open-oral-daily-plan.command.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'

export const dailyPlanHandlers = {
  GetOralDailyPlan: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user => openOralDailyPlan(user.id, params.qualificationPathId)),
      ),
      Effect.map(toDailyPlanDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        TransactionError: failTransaction,
      }),
    ),
  ChangeOralDailyPlanSettings: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          changeOralDailyPlanSettings(user.id, params.qualificationPathId, {
            preference: toPlanPreference(payload.preference),
            expectedVersion: payload.expectedVersion,
          }),
        ),
      ),
      Effect.map(toDailyPlanDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StaleDailyPlanSettings: () => dailyPlanSettingsConflict,
        InvalidPlanPreference: () => invalidDailyPlanSettings,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        TransactionError: failTransaction,
      }),
    ),
} satisfies {
  GetOralDailyPlan: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralDailyPlan,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralDailyPlan>,
    unknown
  >
  ChangeOralDailyPlanSettings: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.ChangeOralDailyPlanSettings,
    HttpApiEndpoint.MiddlewareError<
      typeof Api.groups.OralStudy.endpoints.ChangeOralDailyPlanSettings
    >,
    unknown
  >
}

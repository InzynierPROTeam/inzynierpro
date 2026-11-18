import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction } from '~api/lib/transaction.js'
import { toDailyPlanDto } from '~api/modules/daily-plan/http/mappers.js'
import { failStudyRead, failStudyWrite } from '~api/modules/learning/http/errors.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'
import { openDailyPlan } from '~api/modules/written-study/application/open-daily-plan.command.js'

export const dailyPlanHandlers = {
  GetDailyPlan: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user => openDailyPlan(user.id, params.qualificationPathId)),
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
} satisfies {
  GetDailyPlan: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetDailyPlan,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetDailyPlan>,
    unknown
  >
}

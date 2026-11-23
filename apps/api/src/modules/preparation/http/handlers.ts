import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction, TransactionLive } from '~api/lib/transaction.js'
import {
  failExamCalendarRead,
  failExamCalendarWrite,
} from '~api/modules/exam-calendar/http/errors.js'
import { toExamSessionOptionDto } from '~api/modules/exam-calendar/http/mappers.js'
import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.reader.postgres.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.repository.postgres.js'
import { archivePath } from '~api/modules/preparation/application/archive-path.command.js'
import { changeGoal } from '~api/modules/preparation/application/change-goal.command.js'
import { completeOnboarding } from '~api/modules/preparation/application/complete-onboarding.command.js'
import { extendPath } from '~api/modules/preparation/application/extend-path.command.js'
import { getGoalHistory } from '~api/modules/preparation/application/goal-history.query.js'
import { getGoalOptions } from '~api/modules/preparation/application/goal-options.query.js'
import { PreparationReader } from '~api/modules/preparation/application/preparation.reader.js'
import { restorePath } from '~api/modules/preparation/application/restore-path.command.js'
import { setDistrictChamber } from '~api/modules/preparation/application/set-district-chamber.command.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import {
  failQualificationPathsRead,
  failQualificationPathsWrite,
} from '~api/modules/qualification-paths/http/errors.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { QualificationPathsRepositoryLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.repository.postgres.js'

import {
  districtChamberUnavailable,
  goalConflict,
  invalidPathConfiguration,
  pathAccessDenied,
  pathLimitReached,
  failPreparationRead,
  failPreparationWrite,
} from './errors.js'
import {
  toGoalChange,
  toPathConfiguration,
  toUserExamGoalDto,
  toUserQualificationPathDto,
} from './mappers.js'

export const PreparationLive = HttpApiBuilder.group(Api, 'Preparation', handlers =>
  handlers
    .handle('GetPaths', ({ query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            PreparationReader.use(reader => reader.paths(user.id, query)),
          ),
        ),
        Effect.map(page => mapCursorPage(page, toUserQualificationPathDto)),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('GetPath', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            PreparationReader.use(reader => reader.path(user.id, params.qualificationPathId)),
          ),
        ),
        Effect.map(path => ({
          path: Option.match(path, { onNone: () => null, onSome: toUserQualificationPathDto }),
        })),
        Effect.catchTags({ PreparationReadError: failPreparationRead }),
      ),
    )
    .handle('CompleteOnboarding', ({ payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            completeOnboarding(user.id, toPathConfiguration(payload)),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          QualificationPathsReadError: failQualificationPathsRead,
          QualificationPathsWriteError: failQualificationPathsWrite,
          ExamCalendarReadError: failExamCalendarRead,
          ExamCalendarWriteError: failExamCalendarWrite,
          UserPathLimitReached: () => pathLimitReached,
          StalePathConfiguration: () => invalidPathConfiguration,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('ArchivePath', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => archivePath(user.id, params.qualificationPathId)),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('RestorePath', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => restorePath(user.id, params.qualificationPathId)),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('ExtendPath', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user => extendPath(user.id, params.qualificationPathId)),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('ChangeGoal', ({ payload, params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            changeGoal(user.id, params.qualificationPathId, toGoalChange(payload)),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          ExamCalendarReadError: failExamCalendarRead,
          ExamCalendarWriteError: failExamCalendarWrite,
          QualificationPathsWriteError: failQualificationPathsWrite,
          PathPermissionDenied: () => pathAccessDenied,
          StaleExamGoal: () => goalConflict,
          StalePathConfiguration: () => invalidPathConfiguration,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('SetDistrictChamber', ({ payload, params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            setDistrictChamber(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(payload.districtChamberId),
            ),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          ExamCalendarReadError: failExamCalendarRead,
          ExamCalendarWriteError: failExamCalendarWrite,
          PathPermissionDenied: () => pathAccessDenied,
          DistrictChamberUnavailable: () => districtChamberUnavailable,
          TransactionError: failTransaction,
        }),
      ),
    )
    .handle('GetGoalHistory', ({ query, params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getGoalHistory(user.id, params.qualificationPathId, query),
          ),
        ),
        Effect.map(page => mapCursorPage(page, toUserExamGoalDto)),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('GetGoalOptions', ({ query, params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getGoalOptions(user.id, params.qualificationPathId, query),
          ),
        ),
        Effect.map(page => mapCursorPage(page, toExamSessionOptionDto)),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          ExamCalendarReadError: failExamCalendarRead,
          PathPermissionDenied: () => pathAccessDenied,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    ),
)

export const PreparationRequestServices = Layer.mergeAll(
  TransactionLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  QualificationPathsReaderLive,
  QualificationPathsRepositoryLive,
  ExamCalendarReaderLive,
  ExamCalendarRepositoryLive,
)

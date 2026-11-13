import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
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
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { restorePath } from '~api/modules/preparation/application/restore-path.command.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'
import {
  failQualificationPathsRead,
  failQualificationPathsWrite,
} from '~api/modules/qualification-paths/http/errors.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { QualificationPathsRepositoryLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.repository.postgres.js'

import {
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
  Effect.gen(function* () {
    const preparationReader = yield* PreparationReader
    const preparationRepository = yield* PreparationRepository
    const qualificationPathsReader = yield* QualificationPathsReader
    const qualificationPathsRepository = yield* QualificationPathsRepository
    const examCalendarReader = yield* ExamCalendarReader
    const examCalendarRepository = yield* ExamCalendarRepository

    const dependencies = Layer.mergeAll(
      Layer.succeed(PreparationReader, preparationReader),
      Layer.succeed(PreparationRepository, preparationRepository),
      Layer.succeed(QualificationPathsReader, qualificationPathsReader),
      Layer.succeed(QualificationPathsRepository, qualificationPathsRepository),
      Layer.succeed(ExamCalendarReader, examCalendarReader),
      Layer.succeed(ExamCalendarRepository, examCalendarRepository),
    )

    return handlers
      .handle('GetPaths', ({ query }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user => preparationReader.paths(user.id, query)),
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
              preparationReader.path(user.id, params.qualificationPathId),
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
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PreparationWriteError: failPreparationWrite,
            QualificationPathsReadError: failQualificationPathsRead,
            QualificationPathsWriteError: failQualificationPathsWrite,
            ExamCalendarReadError: failExamCalendarRead,
            ExamCalendarWriteError: failExamCalendarWrite,
            UserPathLimitReached: () => pathLimitReached,
            StalePathConfiguration: () => invalidPathConfiguration,
          }),
        ),
      )
      .handle('ArchivePath', ({ params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user => archivePath(user.id, params.qualificationPathId)),
          ),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PreparationWriteError: failPreparationWrite,
            PathPermissionDenied: () => pathAccessDenied,
          }),
        ),
      )
      .handle('RestorePath', ({ params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user => restorePath(user.id, params.qualificationPathId)),
          ),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PreparationWriteError: failPreparationWrite,
            PathPermissionDenied: () => pathAccessDenied,
          }),
        ),
      )
      .handle('ExtendPath', ({ params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user => extendPath(user.id, params.qualificationPathId)),
          ),
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PreparationWriteError: failPreparationWrite,
            PathPermissionDenied: () => pathAccessDenied,
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
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            PreparationWriteError: failPreparationWrite,
            ExamCalendarReadError: failExamCalendarRead,
            ExamCalendarWriteError: failExamCalendarWrite,
            QualificationPathsWriteError: failQualificationPathsWrite,
            PathPermissionDenied: () => pathAccessDenied,
            StaleExamGoal: () => goalConflict,
            StalePathConfiguration: () => invalidPathConfiguration,
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
          Effect.provide(dependencies),
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
          Effect.provide(dependencies),
          Effect.catchTags({
            PreparationReadError: failPreparationRead,
            ExamCalendarReadError: failExamCalendarRead,
            PathPermissionDenied: () => pathAccessDenied,
            InvalidCursor: () => invalidCursor,
          }),
        ),
      )
  }),
).pipe(
  Layer.provide(AuthenticationLive),
  Layer.provide(
    Layer.mergeAll(
      PreparationReaderLive,
      PreparationRepositoryLive,
      QualificationPathsReaderLive,
      QualificationPathsRepositoryLive,
      ExamCalendarReaderLive,
      ExamCalendarRepositoryLive,
    ),
  ),
)

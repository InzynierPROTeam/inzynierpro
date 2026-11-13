import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import {
  PathAccessDenied,
  PathLimitReached,
  InvalidPathConfiguration,
  GoalConflict,
} from '@inzpro/api-contracts/modules/preparation/errors'
import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { Effect, Option, Layer, Schema } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/exam-calendar.reader.js'
import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/exam-calendar.reader.postgres.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/exam-calendar.repository.postgres.js'
import { PreparationReader } from '~api/modules/preparation/preparation.reader.js'
import { PreparationReaderLive } from '~api/modules/preparation/preparation.reader.postgres.js'
import { PreparationRepository } from '~api/modules/preparation/preparation.repository.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/preparation.repository.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/qualification-paths.reader.postgres.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/qualification-paths.repository.js'
import { QualificationPathsRepositoryLive } from '~api/modules/qualification-paths/qualification-paths.repository.postgres.js'

import { archivePath } from './archive-path.command.js'
import { changeGoal } from './change-goal.command.js'
import { completeOnboarding } from './complete-onboarding.command.js'
import { extendPath } from './extend-path.command.js'
import { getGoalHistory } from './goal-history.query.js'
import { getGoalOptions } from './goal-options.query.js'
import { PathConfiguration, GoalChange } from './preparation.model.js'
import { toUserExamGoalDto, toUserQualificationPathDto } from './preparation.presentation.js'
import { restorePath } from './restore-path.command.js'

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
            Effect.flatMap(CurrentUser, user => preparationReader.paths(user.id, query)).pipe(
              Effect.map(page => ({ ...page, data: page.data.map(toUserQualificationPathDto) })),
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('GetPath', ({ params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              preparationReader.path(user.id, params.qualificationPathId),
            ).pipe(
              Effect.map(path => ({
                path: Option.match(path, {
                  onNone: () => null,
                  onSome: toUserQualificationPathDto,
                }),
              })),
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
              }),
            ),
          ),
        ),
      )
      .handle('CompleteOnboarding', ({ payload }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              Schema.decodeEffect(PathConfiguration)(payload).pipe(
                Effect.flatMap(configuration => completeOnboarding(user.id, configuration)),
              ),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                SchemaError: logAndFailInternalServerError('Could not decode preparation input.'),
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PreparationWriteError: logAndFailInternalServerError(
                  'Could not save preparation data.',
                ),
                QualificationPathsReadError: logAndFailInternalServerError(
                  'Could not read qualification paths.',
                ),
                QualificationPathsWriteError: logAndFailInternalServerError(
                  'Could not validate qualification paths.',
                ),
                ExamCalendarReadError: logAndFailInternalServerError(
                  'Could not read exam sessions.',
                ),
                ExamCalendarWriteError: logAndFailInternalServerError(
                  'Could not validate exam sessions.',
                ),
                UserPathLimitReached: () =>
                  Effect.fail(
                    new PathLimitReached({
                      type: 'path_limit_reached',
                      message: `You can have at most ${maxUserQualificationPaths} qualification paths, including archived paths.`,
                    }),
                  ),
                StalePathConfiguration: () =>
                  Effect.fail(
                    new InvalidPathConfiguration({
                      type: 'invalid_path_configuration',
                      message: 'This configuration is unavailable. Review your choices.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('ArchivePath', ({ params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              archivePath(user.id, params.qualificationPathId),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PreparationWriteError: logAndFailInternalServerError(
                  'Could not save preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('RestorePath', ({ params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              restorePath(user.id, params.qualificationPathId),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PreparationWriteError: logAndFailInternalServerError(
                  'Could not save preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('ExtendPath', ({ params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              extendPath(user.id, params.qualificationPathId),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PreparationWriteError: logAndFailInternalServerError(
                  'Could not save preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('ChangeGoal', ({ payload, params }) =>
        limitByUser(accountWriteLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              Schema.decodeEffect(GoalChange)(payload).pipe(
                Effect.flatMap(change => changeGoal(user.id, params.qualificationPathId, change)),
              ),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                SchemaError: logAndFailInternalServerError('Could not decode preparation input.'),
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PreparationWriteError: logAndFailInternalServerError(
                  'Could not save preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
                ExamCalendarReadError: logAndFailInternalServerError(
                  'Could not read exam sessions.',
                ),
                ExamCalendarWriteError: logAndFailInternalServerError(
                  'Could not validate exam sessions.',
                ),
                QualificationPathsWriteError: logAndFailInternalServerError(
                  'Could not validate qualification paths.',
                ),
                StaleExamGoal: () =>
                  Effect.fail(
                    new GoalConflict({
                      type: 'goal_conflict',
                      message: 'Your goal changed elsewhere. Reload before saving.',
                    }),
                  ),
                StalePathConfiguration: () =>
                  Effect.fail(
                    new InvalidPathConfiguration({
                      type: 'invalid_path_configuration',
                      message: 'This configuration is unavailable. Review your choices.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('GetGoalHistory', ({ query, params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getGoalHistory(user.id, params.qualificationPathId, query),
            ).pipe(
              Effect.map(page => ({ ...page, data: page.data.map(toUserExamGoalDto) })),
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('GetGoalOptions', ({ query, params }) =>
        limitByUser(accountReadLimit).pipe(
          Effect.andThen(
            Effect.flatMap(CurrentUser, user =>
              getGoalOptions(user.id, params.qualificationPathId, query),
            ).pipe(
              Effect.provide(dependencies),
              Effect.catchTags({
                PreparationReadError: logAndFailInternalServerError(
                  'Could not read preparation data.',
                ),
                PathPermissionDenied: () =>
                  Effect.fail(
                    new PathAccessDenied({
                      type: 'path_access_denied',
                      message: 'Your active path does not include this material.',
                    }),
                  ),
                ExamCalendarReadError: logAndFailInternalServerError(
                  'Could not read exam sessions.',
                ),
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
              }),
            ),
          ),
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

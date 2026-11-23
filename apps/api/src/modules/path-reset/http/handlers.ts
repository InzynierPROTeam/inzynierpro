import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction, TransactionLive } from '~api/lib/transaction.js'
import { failStudyWrite } from '~api/modules/learning/http/errors.js'
import { failMockExamWrite } from '~api/modules/mock-exams/http/errors.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-study.repository.postgres.js'
import { resetPath } from '~api/modules/path-reset/application/reset-path.command.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

import { staleUserQualificationPath } from './errors.js'

export const PathResetLive = HttpApiBuilder.group(Api, 'PathReset', handlers =>
  handlers.handle('ResetPath', ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          resetPath(user.id, params.qualificationPathId, payload.expectedVersion),
        ),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        StudyWriteError: failStudyWrite,
        MockExamWriteError: failMockExamWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StaleUserQualificationPath: () => staleUserQualificationPath,
        TransactionError: failTransaction,
      }),
    ),
  ),
)

export const PathResetRequestServices = Layer.mergeAll(
  TransactionLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  StudyRepositoryLive,
  OralStudyRepositoryLive,
  MockExamRepositoryLive,
)

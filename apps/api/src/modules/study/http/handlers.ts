import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import {
  pathAccessDenied,
  failPreparationRead,
  failPreparationWrite,
} from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { getDocument } from '~api/modules/study/application/document.query.js'
import { getDocuments } from '~api/modules/study/application/documents.query.js'
import { getLatestSession } from '~api/modules/study/application/latest-session.query.js'
import { getOralMaterials } from '~api/modules/study/application/oral-materials.query.js'
import { getSessionPreview } from '~api/modules/study/application/session-preview.query.js'
import { getSessionQuestion } from '~api/modules/study/application/session-question.query.js'
import { getSession } from '~api/modules/study/application/session.query.js'
import { startSession } from '~api/modules/study/application/start-session.command.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'

import {
  documentNotFound,
  failStudyRead,
  failStudyWrite,
  staleSessionPreview,
  studySessionAlreadyStarted,
} from './errors.js'
import { toLatestStudySessionDto, toStudySessionDto } from './mappers.js'

export const StudyLive = HttpApiBuilder.group(Api, 'Study', handlers =>
  handlers
    .handle('GetDocuments', ({ query, params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocuments(user.id, params.qualificationPathId, query),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('GetDocument', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocument(user.id, params.qualificationPathId, params.documentId),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyDocumentNotFound: () => documentNotFound,
        }),
      ),
    )
    .handle('GetSessionPreview', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getSessionPreview(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.documentId),
              Option.fromNullishOr(query.afterDocumentId),
            ),
          ),
        ),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralMaterials', ({ query, params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralMaterials(user.id, params.qualificationPathId, query),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('StartSession', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            startSession(
              user.id,
              params.qualificationPathId,
              payload.documentId,
              payload.questionCount,
            ),
          ),
        ),
        Effect.map(toStudySessionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StudyDocumentNotFound: () => documentNotFound,
          StaleSessionScope: () => staleSessionPreview,
          UnfinishedSessionExists: studySessionAlreadyStarted,
        }),
      ),
    )
    .handle('GetLatestSession', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getLatestSession(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.documentId),
            ),
          ),
        ),
        Effect.map(session => Option.getOrNull(Option.map(session, toLatestStudySessionDto))),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetSession', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getSession(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(session => Option.getOrNull(Option.map(session, toStudySessionDto))),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetSessionQuestion', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getSessionQuestion(
              user.id,
              params.qualificationPathId,
              params.sessionId,
              params.position,
            ),
          ),
        ),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    ),
).pipe(Layer.provide(AuthenticationLive))

/** Services the study handlers need per request; the API layer provides them where routes are registered. */
export const StudyRequestServices = Layer.mergeAll(
  PreparationReaderLive,
  PreparationRepositoryLive,
  StudyReaderLive,
  StudyRepositoryLive,
)

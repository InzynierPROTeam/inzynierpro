import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
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
import { endSession } from '~api/modules/study/application/end-session.command.js'
import { getLatestSession } from '~api/modules/study/application/latest-session.query.js'
import { getOralMaterials } from '~api/modules/study/application/oral-materials.query.js'
import { recordAssistance } from '~api/modules/study/application/record-assistance.command.js'
import { getReviewPreview } from '~api/modules/study/application/review-preview.query.js'
import { getReviewSession } from '~api/modules/study/application/review-session.query.js'
import { ReviewSchedulerLive } from '~api/modules/study/application/review-state.service.js'
import { getSessionPreview } from '~api/modules/study/application/session-preview.query.js'
import { getSessionQuestion } from '~api/modules/study/application/session-question.query.js'
import { getSessionResults } from '~api/modules/study/application/session-results.query.js'
import { getSessionSummary } from '~api/modules/study/application/session-summary.query.js'
import { getSession } from '~api/modules/study/application/session.query.js'
import { startReviewSession } from '~api/modules/study/application/start-review-session.command.js'
import { startSession } from '~api/modules/study/application/start-session.command.js'
import { submitAnswer } from '~api/modules/study/application/submit-answer.command.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'

import {
  documentNotFound,
  failStudyRead,
  failStudyWrite,
  invalidSessionAnswer,
  sessionAnswerAlreadySubmitted,
  sessionQuestionNotFound,
  sessionQuestionWithdrawn,
  staleSessionPreview,
  studySessionAlreadyStarted,
  studySessionEnded,
  studySessionNotFound,
} from './errors.js'
import {
  toLatestStudySessionDto,
  toReviewPreviewDto,
  toSessionQuestionDto,
  toSessionQuestionResultDto,
  toStudySessionDto,
  toStudySessionSummaryDto,
} from './mappers.js'

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
              Option.fromNullishOr(query.fromDocumentId),
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
              payload.questionSelection,
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
    .handle('GetReviewPreview', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getReviewPreview(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.documentId),
            ),
          ),
        ),
        Effect.map(Option.map(toReviewPreviewDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetReviewSession', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getReviewSession(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.documentId),
            ),
          ),
        ),
        Effect.map(Option.map(toStudySessionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('StartReviewSession', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            startReviewSession(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(payload.documentId),
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
        Effect.map(Option.flatMap(toLatestStudySessionDto)),
        Effect.map(Option.getOrNull),
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
        Effect.map(Option.map(toStudySessionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetSessionSummary', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getSessionSummary(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(Option.map(toStudySessionSummaryDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetSessionResults', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getSessionResults(user.id, params.qualificationPathId, params.sessionId, query),
          ),
        ),
        Effect.map(page => mapCursorPage(page, toSessionQuestionResultDto)),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('EndSession', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            endSession(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(toStudySessionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          StudySessionMissing: () => studySessionNotFound,
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
        Effect.map(Option.map(toSessionQuestionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('RecordSessionAssistance', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            recordAssistance(
              user.id,
              params.qualificationPathId,
              params.sessionId,
              params.position,
            ),
          ),
        ),
        Effect.map(toSessionQuestionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          SessionQuestionMissing: () => sessionQuestionNotFound,
        }),
      ),
    )
    .handle('SubmitSessionAnswer', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            submitAnswer(
              user.id,
              params.qualificationPathId,
              params.sessionId,
              params.position,
              payload.questionRevisionId,
              payload.answerId,
            ),
          ),
        ),
        Effect.map(({ question, session }) => ({
          question: toSessionQuestionDto(question),
          session: toStudySessionDto(session),
        })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          SessionQuestionMissing: () => sessionQuestionNotFound,
          SessionAlreadyEnded: () => studySessionEnded,
          QuestionRevisionWithdrawn: () => sessionQuestionWithdrawn,
          AnswerNotInQuestion: () => invalidSessionAnswer,
          QuestionAlreadyAnswered: () => sessionAnswerAlreadySubmitted,
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
  ReviewSchedulerLive,
)

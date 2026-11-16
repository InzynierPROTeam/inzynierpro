import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { endOralSession } from '~api/modules/study/application/end-oral-session.command.js'
import { getOralMaterials } from '~api/modules/study/application/oral-materials.query.js'
import { getOralSessionNextStep } from '~api/modules/study/application/oral-session-next-step.query.js'
import { getOralSessionPreview } from '~api/modules/study/application/oral-session-preview.query.js'
import {
  getLatestOralSession,
  getOralSession,
  getOralSessionQuestion,
  getOralSessionResults,
  getOralSessionSummary,
} from '~api/modules/study/application/oral-session.query.js'
import { ReviewSchedulerLive } from '~api/modules/study/application/review-state.service.js'
import { startOralSession } from '~api/modules/study/application/start-oral-session.command.js'
import { submitOralSelfAssessment } from '~api/modules/study/application/submit-oral-self-assessment.command.js'
import { OralStudyReaderLive } from '~api/modules/study/infrastructure/oral-study.reader.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/study/infrastructure/oral-study.repository.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'

import {
  failStudyRead,
  failStudyWrite,
  invalidOralSelfAssessment,
  oralCategoryNotFound,
  oralSelfAssessmentAlreadySubmitted,
  oralSessionAlreadyStarted,
  sessionQuestionNotFound,
  sessionQuestionWithdrawn,
  staleSessionPreview,
  studySessionEnded,
  studySessionNotFound,
} from './errors.js'
import {
  toOralSessionNextStepDto,
  toOralSessionQuestionDto,
  toOralSessionQuestionResultDto,
  toOralStudySessionDto,
  toOralStudySessionSummaryDto,
} from './mappers.js'

export const OralStudyLive = HttpApiBuilder.group(Api, 'OralStudy', handlers =>
  handlers
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
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralSessionPreview', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralSessionPreview(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.categoryId),
              Option.fromNullishOr(query.fromCategoryId),
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
    .handle('StartOralSession', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            startOralSession(
              user.id,
              params.qualificationPathId,
              payload.categoryId,
              payload.questionCount,
            ),
          ),
        ),
        Effect.map(toOralStudySessionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PreparationWriteError: failPreparationWrite,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          OralCategoryNotOnPath: () => oralCategoryNotFound,
          StaleSessionScope: () => staleSessionPreview,
          UnfinishedOralSessionExists: oralSessionAlreadyStarted,
        }),
      ),
    )
    .handle('GetLatestOralSession', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getLatestOralSession(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.categoryId),
            ),
          ),
        ),
        Effect.map(Option.map(toOralStudySessionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralSession', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralSession(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(Option.map(toOralStudySessionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralSessionNextStep', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralSessionNextStep(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(Option.map(toOralSessionNextStepDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralSessionSummary', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralSessionSummary(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(Option.map(toOralStudySessionSummaryDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralSessionResults', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralSessionResults(user.id, params.qualificationPathId, params.sessionId, query),
          ),
        ),
        Effect.map(page => mapCursorPage(page, toOralSessionQuestionResultDto)),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('EndOralSession', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            endOralSession(user.id, params.qualificationPathId, params.sessionId),
          ),
        ),
        Effect.map(toOralStudySessionDto),
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
    .handle('GetOralSessionQuestion', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralSessionQuestion(
              user.id,
              params.qualificationPathId,
              params.sessionId,
              params.position,
            ),
          ),
        ),
        Effect.map(Option.map(toOralSessionQuestionDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('SubmitOralSelfAssessment', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            submitOralSelfAssessment(
              user.id,
              params.qualificationPathId,
              params.sessionId,
              params.position,
              payload.oralRevisionId,
              payload.selfAssessment,
            ),
          ),
        ),
        Effect.map(({ question, session }) => ({
          question: toOralSessionQuestionDto(question),
          session: toOralStudySessionDto(session),
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
          OralRevisionNotInSession: () => invalidOralSelfAssessment,
          OralQuestionAlreadyAssessed: () => oralSelfAssessmentAlreadySubmitted,
        }),
      ),
    ),
).pipe(Layer.provide(AuthenticationLive))

export const OralStudyRequestServices = Layer.mergeAll(
  PreparationReaderLive,
  PreparationRepositoryLive,
  OralStudyReaderLive,
  OralStudyRepositoryLive,
  StudyRepositoryLive,
  ReviewSchedulerLive,
)

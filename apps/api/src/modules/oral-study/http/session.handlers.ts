import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { pathOralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction } from '~api/lib/transaction.js'
import {
  failStudyRead,
  failStudyWrite,
  sessionQuestionNotFound,
  sessionQuestionWithdrawn,
  staleSessionPreview,
  studySessionEnded,
  studySessionNotFound,
} from '~api/modules/learning/http/errors.js'
import { endOralSession } from '~api/modules/oral-study/application/end-oral-session.command.js'
import { getOralSessionNextStep } from '~api/modules/oral-study/application/oral-session-next-step.query.js'
import {
  getLatestOralSession,
  getOralSession,
  getOralSessionQuestion,
  getOralSessionResults,
  getOralSessionSummary,
} from '~api/modules/oral-study/application/oral-session.query.js'
import { startOralSession } from '~api/modules/oral-study/application/start-oral-session.command.js'
import { submitOralSelfAssessment } from '~api/modules/oral-study/application/submit-oral-self-assessment.command.js'
import {
  districtChamberNotChosen,
  invalidOralSelfAssessment,
  oralCategoryNotFound,
  oralSelfAssessmentAlreadySubmitted,
  oralSessionAlreadyStarted,
} from '~api/modules/oral-study/http/errors.js'
import {
  toOralSessionNextStepDto,
  toOralSessionQuestionDto,
  toOralSessionQuestionResultDto,
  toOralStudySessionDto,
  toOralStudySessionSummaryDto,
} from '~api/modules/oral-study/http/mappers.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'

export const sessionHandlers = {
  StartOralSession: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          startOralSession(
            user.id,
            params.qualificationPathId,
            payload.categoryId,
            payload.questionCount,
            payload.questionScope ?? pathOralQuestionScope,
          ),
        ),
      ),
      Effect.map(toOralStudySessionDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        DistrictChamberNotChosen: () => districtChamberNotChosen,
        StudyWriteError: failStudyWrite,
        OralCategoryNotOnPath: () => oralCategoryNotFound,
        StaleSessionScope: () => staleSessionPreview,
        UnfinishedOralSessionExists: oralSessionAlreadyStarted,
        TransactionError: failTransaction,
      }),
    ),
  GetLatestOralSession: ({ params, query }) =>
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
  GetOralSession: ({ params }) =>
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
  GetOralSessionNextStep: ({ params }) =>
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
  GetOralSessionSummary: ({ params }) =>
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
  GetOralSessionResults: ({ params, query }) =>
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
  EndOralSession: ({ params }) =>
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
        TransactionError: failTransaction,
      }),
    ),
  GetOralSessionQuestion: ({ params }) =>
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
  SubmitOralSelfAssessment: ({ params, payload }) =>
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
        TransactionError: failTransaction,
      }),
    ),
} satisfies {
  StartOralSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.StartOralSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.StartOralSession>,
    unknown
  >
  GetLatestOralSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetLatestOralSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetLatestOralSession>,
    unknown
  >
  GetOralSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSession>,
    unknown
  >
  GetOralSessionNextStep: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSessionNextStep,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSessionNextStep>,
    unknown
  >
  GetOralSessionSummary: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSessionSummary,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSessionSummary>,
    unknown
  >
  GetOralSessionResults: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSessionResults,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSessionResults>,
    unknown
  >
  EndOralSession: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.EndOralSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.EndOralSession>,
    unknown
  >
  GetOralSessionQuestion: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSessionQuestion,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSessionQuestion>,
    unknown
  >
  SubmitOralSelfAssessment: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.SubmitOralSelfAssessment,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.SubmitOralSelfAssessment>,
    unknown
  >
}

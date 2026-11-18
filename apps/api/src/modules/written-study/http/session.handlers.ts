import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import {
  explanationAssistanceKind,
  noteAssistanceKind,
  type SessionAssistanceKind,
} from '@inzpro/domain/modules/learning/study-session'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction } from '~api/lib/transaction.js'
import { failXpRead, failXpWrite } from '~api/modules/learning-xp/http/errors.js'
import { toLearningRewardsDto } from '~api/modules/learning-xp/http/mappers.js'
import {
  failStudyRead,
  failStudyWrite,
  sessionQuestionNotFound,
  sessionQuestionWithdrawn,
  staleSessionPreview,
  studySessionEnded,
  studySessionNotFound,
} from '~api/modules/learning/http/errors.js'
import {
  pathAccessDenied,
  failPreparationRead,
  failPreparationWrite,
} from '~api/modules/preparation/http/errors.js'
import { failStreakRead, failStreakWrite } from '~api/modules/streak/http/errors.js'
import { endSession } from '~api/modules/written-study/application/end-session.command.js'
import { getLatestSession } from '~api/modules/written-study/application/latest-session.query.js'
import {
  recordExplanationOpening,
  recordNoteOpening,
} from '~api/modules/written-study/application/record-assistance.command.js'
import { getSessionNextStep } from '~api/modules/written-study/application/session-next-step.query.js'
import { getSessionQuestion } from '~api/modules/written-study/application/session-question.query.js'
import { getSessionResults } from '~api/modules/written-study/application/session-results.query.js'
import { getSessionSummary } from '~api/modules/written-study/application/session-summary.query.js'
import { getSession } from '~api/modules/written-study/application/session.query.js'
import { startSession } from '~api/modules/written-study/application/start-session.command.js'
import { submitAnswer } from '~api/modules/written-study/application/submit-answer.command.js'
import {
  documentNotFound,
  invalidSessionAnswer,
  sessionAnswerAlreadySubmitted,
  studySessionAlreadyStarted,
} from '~api/modules/written-study/http/errors.js'
import {
  toLatestStudySessionDto,
  toSessionQuestionDto,
  toSessionQuestionResultDto,
  toStudySessionDto,
  toStudySessionSummaryDto,
  toSessionNextStepDto,
} from '~api/modules/written-study/http/mappers.js'

const assistanceRecords = {
  [explanationAssistanceKind]: recordExplanationOpening,
  [noteAssistanceKind]: recordNoteOpening,
} satisfies Record<SessionAssistanceKind, typeof recordExplanationOpening>

export const sessionHandlers = {
  StartSession: ({ params, payload }) =>
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
        TransactionError: failTransaction,
      }),
    ),
  GetLatestSession: ({ params, query }) =>
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
  GetSession: ({ params }) =>
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
  GetSessionSummary: ({ params }) =>
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
  GetSessionNextStep: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getSessionNextStep(user.id, params.qualificationPathId, params.sessionId),
        ),
      ),
      Effect.map(Option.flatMap(toSessionNextStepDto)),
      Effect.map(Option.getOrNull),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  GetSessionResults: ({ params, query }) =>
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
  EndSession: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          endSession(user.id, params.qualificationPathId, params.sessionId),
        ),
      ),
      Effect.map(({ session, rewards }) => ({
        session: toStudySessionDto(session),
        rewards: toLearningRewardsDto(rewards),
      })),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        StudySessionMissing: () => studySessionNotFound,
        TransactionError: failTransaction,
        XpReadError: failXpRead,
        XpWriteError: failXpWrite,
      }),
    ),
  GetSessionQuestion: ({ params }) =>
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
  RecordSessionAssistance: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          assistanceRecords[payload.kind](
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
        TransactionError: failTransaction,
      }),
    ),
  SubmitSessionAnswer: ({ params, payload }) =>
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
      Effect.map(({ question, session, awardedXp, rewards }) => ({
        awardedXp,
        rewards: toLearningRewardsDto(rewards),
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
        StreakReadError: failStreakRead,
        StreakWriteError: failStreakWrite,
        XpReadError: failXpRead,
        XpWriteError: failXpWrite,
        TransactionError: failTransaction,
      }),
    ),
} satisfies {
  StartSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.StartSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.StartSession>,
    unknown
  >
  GetLatestSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetLatestSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetLatestSession>,
    unknown
  >
  GetSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetSession>,
    unknown
  >
  GetSessionSummary: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetSessionSummary,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetSessionSummary>,
    unknown
  >
  GetSessionNextStep: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetSessionNextStep,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetSessionNextStep>,
    unknown
  >
  GetSessionResults: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetSessionResults,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetSessionResults>,
    unknown
  >
  EndSession: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.EndSession,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.EndSession>,
    unknown
  >
  GetSessionQuestion: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetSessionQuestion,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetSessionQuestion>,
    unknown
  >
  RecordSessionAssistance: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.RecordSessionAssistance,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.RecordSessionAssistance>,
    unknown
  >
  SubmitSessionAnswer: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.SubmitSessionAnswer,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.SubmitSessionAnswer>,
    unknown
  >
}

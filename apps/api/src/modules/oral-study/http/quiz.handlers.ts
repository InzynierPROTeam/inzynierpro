import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction } from '~api/lib/transaction.js'
import {
  failStudyRead,
  failStudyWrite,
  studySessionNotFound,
} from '~api/modules/learning/http/errors.js'
import { answerOralQuizCheck } from '~api/modules/oral-study/application/answer-oral-quiz-check.command.js'
import {
  getOralQuizChecks,
  getOralSessionQuizState,
} from '~api/modules/oral-study/application/oral-session-quiz.query.js'
import { startOralSessionQuiz } from '~api/modules/oral-study/application/start-oral-session-quiz.command.js'
import {
  invalidOralQuizSelection,
  oralQuizCheckAlreadyAnswered,
  oralQuizCheckNotFound,
  oralQuizFormatUnsupported,
  oralQuizUnavailable,
} from '~api/modules/oral-study/http/errors.js'
import { toOralQuizCheckDto, toOralSessionQuizDto } from '~api/modules/oral-study/http/mappers.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'

export const quizHandlers = {
  GetOralSessionQuiz: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralSessionQuizState(user.id, params.qualificationPathId, params.sessionId),
        ),
      ),
      Effect.map(
        Option.match({
          onNone: () => null,
          onSome: ({ quiz, availableFormats }) => ({
            quiz: Option.match(quiz, { onNone: () => null, onSome: toOralSessionQuizDto }),
            availableFormats,
          }),
        }),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
      }),
    ),
  GetOralQuizChecks: ({ params, query }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralQuizChecks(user.id, params.qualificationPathId, params.sessionId, query),
        ),
      ),
      Effect.map(page => mapCursorPage(page, toOralQuizCheckDto)),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        InvalidCursor: () => invalidCursor,
      }),
    ),
  StartOralSessionQuiz: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          startOralSessionQuiz(
            user.id,
            params.qualificationPathId,
            params.sessionId,
            payload.formats,
          ),
        ),
      ),
      Effect.map(toOralSessionQuizDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        StudySessionMissing: () => studySessionNotFound,
        OralQuizNotOffered: () => oralQuizUnavailable,
        OralQuizFormatNotSupported: () => oralQuizFormatUnsupported,
        TransactionError: failTransaction,
      }),
    ),
  AnswerOralQuizCheck: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          answerOralQuizCheck(
            user.id,
            params.qualificationPathId,
            params.sessionId,
            params.position,
            payload.optionIds,
          ),
        ),
      ),
      Effect.map(({ check, quiz }) => ({
        check: toOralQuizCheckDto(check),
        quiz: toOralSessionQuizDto(quiz),
      })),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        OralQuizCheckMissing: () => oralQuizCheckNotFound,
        OralQuizCheckAlreadyChecked: () => oralQuizCheckAlreadyAnswered,
        OralQuizSelectionNotAllowed: () => invalidOralQuizSelection,
        TransactionError: failTransaction,
      }),
    ),
} satisfies {
  GetOralSessionQuiz: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralSessionQuiz,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralSessionQuiz>,
    unknown
  >
  GetOralQuizChecks: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralQuizChecks,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralQuizChecks>,
    unknown
  >
  StartOralSessionQuiz: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.StartOralSessionQuiz,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.StartOralSessionQuiz>,
    unknown
  >
  AnswerOralQuizCheck: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.AnswerOralQuizCheck,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.AnswerOralQuizCheck>,
    unknown
  >
}

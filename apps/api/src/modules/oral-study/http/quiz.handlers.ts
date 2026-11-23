import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { type CursorPage, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import { failTransaction } from '~api/lib/transaction.js'
import { withContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import { failXpRead, failXpWrite } from '~api/modules/learning-xp/http/errors.js'
import { toLearningRewardsDto } from '~api/modules/learning-xp/http/mappers.js'
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
import type { OralQuizCheck } from '~api/modules/oral-study/domain/oral-session-quiz.model.js'
import {
  invalidOralQuizSelection,
  oralQuizCheckAlreadyAnswered,
  oralQuizCheckNotFound,
  oralQuizFormatUnsupported,
  oralQuizUnavailable,
} from '~api/modules/oral-study/http/errors.js'
import {
  revealedQuizCheckContents,
  toOralQuizCheckDto,
  toOralSessionQuizDto,
} from '~api/modules/oral-study/http/mappers.js'
import {
  failPreparationRead,
  failPreparationWrite,
  pathAccessDenied,
} from '~api/modules/preparation/http/errors.js'
import { failStreakRead, failStreakWrite } from '~api/modules/streak/http/errors.js'

const signedOralQuizCheckDto = withContentAssetAddresses(
  check => revealedQuizCheckContents([check]),
  toOralQuizCheckDto,
)

const signedOralQuizCheckPage = withContentAssetAddresses(
  (page: CursorPage<OralQuizCheck>) => revealedQuizCheckContents(page.data),
  (page, addresses) => mapCursorPage(page, check => toOralQuizCheckDto(check, addresses)),
)

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
      Effect.flatMap(signedOralQuizCheckPage),
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
      Effect.flatMap(({ check, quiz, rewards }) =>
        Effect.map(signedOralQuizCheckDto(check), checkDto => ({
          rewards: toLearningRewardsDto(rewards),
          check: checkDto,
          quiz: toOralSessionQuizDto(quiz),
        })),
      ),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PreparationWriteError: failPreparationWrite,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        StudyWriteError: failStudyWrite,
        OralQuizCheckMissing: () => oralQuizCheckNotFound,
        OralQuizCheckAlreadyChecked: () => oralQuizCheckAlreadyAnswered,
        OralQuizSelectionNotAllowed: () => invalidOralQuizSelection,
        StreakReadError: failStreakRead,
        StreakWriteError: failStreakWrite,
        XpReadError: failXpRead,
        XpWriteError: failXpWrite,
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

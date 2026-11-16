import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { pathOralQuestionScope } from '@inzpro/domain/modules/study/oral-study-session'
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
import { answerOralQuizCheck } from '~api/modules/study/application/answer-oral-quiz-check.command.js'
import { clearOralQuestionNote } from '~api/modules/study/application/clear-oral-question-note.command.js'
import { endOralSession } from '~api/modules/study/application/end-oral-session.command.js'
import { markOralFavorite } from '~api/modules/study/application/mark-oral-favorite.command.js'
import {
  getOralFavoritesPreview,
  getOralFavoritesSession,
} from '~api/modules/study/application/oral-favorites-preview.query.js'
import { getOralMaterials } from '~api/modules/study/application/oral-materials.query.js'
import {
  getOralReviewPreview,
  getOralReviewSession,
} from '~api/modules/study/application/oral-review-preview.query.js'
import { getOralSessionNextStep } from '~api/modules/study/application/oral-session-next-step.query.js'
import { getOralSessionPreview } from '~api/modules/study/application/oral-session-preview.query.js'
import {
  getOralQuizChecks,
  getOralSessionQuizState,
} from '~api/modules/study/application/oral-session-quiz.query.js'
import {
  getLatestOralSession,
  getOralSession,
  getOralSessionQuestion,
  getOralSessionResults,
  getOralSessionSummary,
} from '~api/modules/study/application/oral-session.query.js'
import { ReviewSchedulerLive } from '~api/modules/study/application/review-state.service.js'
import { saveOralQuestionNote } from '~api/modules/study/application/save-oral-question-note.command.js'
import { startOralFavoritesSession } from '~api/modules/study/application/start-oral-favorites-session.command.js'
import { startOralReviewSession } from '~api/modules/study/application/start-oral-review-session.command.js'
import { startOralSessionQuiz } from '~api/modules/study/application/start-oral-session-quiz.command.js'
import { startOralSession } from '~api/modules/study/application/start-oral-session.command.js'
import { submitOralSelfAssessment } from '~api/modules/study/application/submit-oral-self-assessment.command.js'
import { unmarkOralFavorite } from '~api/modules/study/application/unmark-oral-favorite.command.js'
import { OralSessionQuizReaderLive } from '~api/modules/study/infrastructure/oral-session-quiz.reader.postgres.js'
import { OralSessionQuizRepositoryLive } from '~api/modules/study/infrastructure/oral-session-quiz.repository.postgres.js'
import { OralStudyReaderLive } from '~api/modules/study/infrastructure/oral-study.reader.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/study/infrastructure/oral-study.repository.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'

import {
  districtChamberNotChosen,
  failQuestionNoteWrite,
  invalidOralQuizSelection,
  oralQuizCheckAlreadyAnswered,
  oralQuizCheckNotFound,
  oralQuizFormatUnsupported,
  oralQuizUnavailable,
  questionNotFound,
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
  toOralQuizCheckDto,
  toOralSessionQuizDto,
  toQuestionNoteDto,
  toOralReviewPreviewDto,
  toOralSessionNextStepDto,
  toOralSessionQuestionDto,
  toOralSessionQuestionResultDto,
  toOralStudySessionDto,
  toOralStudySessionSummaryDto,
} from './mappers.js'

export const OralStudyLive = HttpApiBuilder.group(Api, 'OralStudy', handlers =>
  handlers
    .handle('ClearOralQuestionNote', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            clearOralQuestionNote(user.id, params.qualificationPathId, params.questionId),
          ),
        ),
        Effect.map(result => ({
          questionId: result.questionId,
          note: Option.match(result.note, { onNone: () => null, onSome: toQuestionNoteDto }),
        })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyWriteError: failStudyWrite,
        }),
      ),
    )
    .handle('SaveOralQuestionNote', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            saveOralQuestionNote(
              user.id,
              params.qualificationPathId,
              params.questionId,
              payload.text,
            ),
          ),
        ),
        Effect.map(result => ({
          questionId: result.questionId,
          note: Option.match(result.note, { onNone: () => null, onSome: toQuestionNoteDto }),
        })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          QuestionNoteWriteError: failQuestionNoteWrite,
          QuestionNotOnPath: () => questionNotFound,
        }),
      ),
    )
    .handle('UnmarkOralFavoriteQuestion', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            unmarkOralFavorite(user.id, params.qualificationPathId, params.questionId),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyWriteError: failStudyWrite,
        }),
      ),
    )
    .handle('MarkOralFavoriteQuestion', ({ params }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            markOralFavorite(user.id, params.qualificationPathId, params.questionId),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          StudyWriteError: failStudyWrite,
          QuestionNotOnPath: () => questionNotFound,
        }),
      ),
    )
    .handle('GetOralFavoritesPreview', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralFavoritesPreview(user.id, params.qualificationPathId),
          ),
        ),
        Effect.map(result => ({ ...result, settings: Option.getOrNull(result.settings) })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
        }),
      ),
    )
    .handle('GetOralFavoritesSession', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralFavoritesSession(user.id, params.qualificationPathId),
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
    .handle('StartOralFavoritesSession', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            startOralFavoritesSession(user.id, params.qualificationPathId, payload.questionCount),
          ),
        ),
        Effect.map(toOralStudySessionDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          PreparationWriteError: failPreparationWrite,
          StudyWriteError: failStudyWrite,
          StaleSessionScope: () => staleSessionPreview,
          UnfinishedOralSessionExists: oralSessionAlreadyStarted,
        }),
      ),
    )
    .handle('GetOralReviewPreview', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralReviewPreview(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(query.categoryId),
              query.questionScope ?? pathOralQuestionScope,
            ),
          ),
        ),
        Effect.map(Option.map(toOralReviewPreviewDto)),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          DistrictChamberNotChosen: () => districtChamberNotChosen,
        }),
      ),
    )
    .handle('GetOralReviewSession', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getOralReviewSession(
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
    .handle('StartOralReviewSession', ({ params, payload }) =>
      limitByUser(accountWriteLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            startOralReviewSession(
              user.id,
              params.qualificationPathId,
              Option.fromNullishOr(payload.categoryId),
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
              query.questionScope ?? pathOralQuestionScope,
            ),
          ),
        ),
        Effect.map(Option.getOrNull),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          StudyReadError: failStudyRead,
          DistrictChamberNotChosen: () => districtChamberNotChosen,
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
    .handle('GetOralSessionQuiz', ({ params }) =>
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
    )
    .handle('GetOralQuizChecks', ({ params, query }) =>
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
    )
    .handle('StartOralSessionQuiz', ({ params, payload }) =>
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
        }),
      ),
    )
    .handle('AnswerOralQuizCheck', ({ params, payload }) =>
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
  OralSessionQuizReaderLive,
  OralSessionQuizRepositoryLive,
  StudyRepositoryLive,
  ReviewSchedulerLive,
)

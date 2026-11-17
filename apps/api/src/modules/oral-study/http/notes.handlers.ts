import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Option } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import {
  failQuestionNoteWrite,
  questionNotFound,
  failStudyRead,
  failStudyWrite,
} from '~api/modules/learning/http/errors.js'
import { toQuestionNoteDto } from '~api/modules/learning/http/mappers.js'
import { clearOralQuestionNote } from '~api/modules/oral-study/application/clear-oral-question-note.command.js'
import { saveOralQuestionNote } from '~api/modules/oral-study/application/save-oral-question-note.command.js'
import { failPreparationRead, pathAccessDenied } from '~api/modules/preparation/http/errors.js'

export const notesHandlers = {
  ClearOralQuestionNote: ({ params }) =>
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
  SaveOralQuestionNote: ({ params, payload }) =>
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
} satisfies {
  ClearOralQuestionNote: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.ClearOralQuestionNote,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.ClearOralQuestionNote>,
    unknown
  >
  SaveOralQuestionNote: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.SaveOralQuestionNote,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.SaveOralQuestionNote>,
    unknown
  >
}

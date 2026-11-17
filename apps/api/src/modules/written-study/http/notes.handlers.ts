import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountWriteLimit, limitByUser } from '~api/lib/rate-limit.js'
import {
  failQuestionNoteWrite,
  failStudyRead,
  failStudyWrite,
  questionNotFound,
} from '~api/modules/learning/http/errors.js'
import { pathAccessDenied, failPreparationRead } from '~api/modules/preparation/http/errors.js'
import { clearQuestionNote } from '~api/modules/written-study/application/clear-question-note.command.js'
import { saveQuestionNote } from '~api/modules/written-study/application/save-question-note.command.js'
import { toQuestionNoteResultDto } from '~api/modules/written-study/http/mappers.js'

export const notesHandlers = {
  SaveQuestionNote: ({ params, payload }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          saveQuestionNote(user.id, params.qualificationPathId, params.questionId, payload.text),
        ),
      ),
      Effect.map(toQuestionNoteResultDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        QuestionNoteWriteError: failQuestionNoteWrite,
        QuestionNotOnPath: () => questionNotFound,
      }),
    ),
  ClearQuestionNote: ({ params }) =>
    limitByUser(accountWriteLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          clearQuestionNote(user.id, params.qualificationPathId, params.questionId),
        ),
      ),
      Effect.map(toQuestionNoteResultDto),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyWriteError: failStudyWrite,
      }),
    ),
} satisfies {
  SaveQuestionNote: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.SaveQuestionNote,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.SaveQuestionNote>,
    unknown
  >
  ClearQuestionNote: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.ClearQuestionNote,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.ClearQuestionNote>,
    unknown
  >
}

import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { withContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import {
  type WithQuestionReferences,
  withWrittenQuestionReferences,
} from '~api/modules/learning-content/application/question-references.service.js'
import { failLearningContentRead } from '~api/modules/learning-content/http/errors.js'
import { questionReferenceContents } from '~api/modules/learning-content/http/mappers.js'
import { failStudyRead, questionNotFound } from '~api/modules/learning/http/errors.js'
import { failPreparationRead, pathAccessDenied } from '~api/modules/preparation/http/errors.js'
import { getQuestionDetails } from '~api/modules/written-study/application/question-details.query.js'
import type { QuestionDetails } from '~api/modules/written-study/domain/question-details.model.js'
import { toQuestionDetailsDto } from '~api/modules/written-study/http/mappers.js'

const signedQuestionDetailsDto = withContentAssetAddresses(
  ({ question, references }: WithQuestionReferences<QuestionDetails>) => [
    question.explanation,
    ...questionReferenceContents(references),
  ],
  toQuestionDetailsDto,
)

const questionDetailsDto = (pathId: QualificationPathId) => (details: QuestionDetails) =>
  withWrittenQuestionReferences(pathId)(details).pipe(Effect.flatMap(signedQuestionDetailsDto))

export const detailsHandlers = {
  GetQuestionDetails: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getQuestionDetails(user.id, params.qualificationPathId, params.questionId),
        ),
      ),
      Effect.flatMap(questionDetailsDto(params.qualificationPathId)),
      Effect.catchTags({
        PreparationReadError: failPreparationRead,
        PathPermissionDenied: () => pathAccessDenied,
        StudyReadError: failStudyRead,
        LearningContentReadError: failLearningContentRead,
        QuestionNotOnPath: () => questionNotFound,
      }),
    ),
} satisfies {
  GetQuestionDetails: HttpApiEndpoint.Handler<
    typeof Api.groups.Study.endpoints.GetQuestionDetails,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.Study.endpoints.GetQuestionDetails>,
    unknown
  >
}

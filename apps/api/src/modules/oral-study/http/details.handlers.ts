import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { HttpApiEndpoint } from 'effect/http-api'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { withContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import {
  type WithQuestionReferences,
  withOralQuestionReferences,
} from '~api/modules/learning-content/application/question-references.service.js'
import { failLearningContentRead } from '~api/modules/learning-content/http/errors.js'
import { questionReferenceContents } from '~api/modules/learning-content/http/mappers.js'
import { failStudyRead, questionNotFound } from '~api/modules/learning/http/errors.js'
import { getOralQuestionDetails } from '~api/modules/oral-study/application/oral-question-details.query.js'
import type { OralQuestionDetails } from '~api/modules/oral-study/domain/oral-question-details.model.js'
import { toOralQuestionDetailsDto } from '~api/modules/oral-study/http/mappers.js'
import { failPreparationRead, pathAccessDenied } from '~api/modules/preparation/http/errors.js'

const signedQuestionDetailsDto = withContentAssetAddresses(
  ({ question, references }: WithQuestionReferences<OralQuestionDetails>) => [
    question.body,
    question.answer,
    ...questionReferenceContents(references),
  ],
  toOralQuestionDetailsDto,
)

const questionDetailsDto = (pathId: QualificationPathId) => (details: OralQuestionDetails) =>
  withOralQuestionReferences(pathId)(details).pipe(Effect.flatMap(signedQuestionDetailsDto))

export const detailsHandlers = {
  GetOralQuestionDetails: ({ params }) =>
    limitByUser(accountReadLimit).pipe(
      Effect.andThen(
        Effect.flatMap(CurrentUser, user =>
          getOralQuestionDetails(user.id, params.qualificationPathId, params.questionId),
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
  GetOralQuestionDetails: HttpApiEndpoint.Handler<
    typeof Api.groups.OralStudy.endpoints.GetOralQuestionDetails,
    HttpApiEndpoint.MiddlewareError<typeof Api.groups.OralStudy.endpoints.GetOralQuestionDetails>,
    unknown
  >
}

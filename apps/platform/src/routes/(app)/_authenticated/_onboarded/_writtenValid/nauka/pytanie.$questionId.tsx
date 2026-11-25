import { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { questionDetailsQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { QuestionDetailsPage } from '~platform/features/written/QuestionDetailsPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/pytanie/$questionId',
)({
  params: {
    parse: params => ({ questionId: Schema.decodeSync(WrittenQuestionId)(params.questionId) }),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    void queryClient
      .query(
        questionDetailsQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id, questionId: params.questionId },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Pytanie' },
  component: QuestionDetailsPage,
  head: () => ({ meta: seo({ title: 'Pytanie pisemne' }) }),
})

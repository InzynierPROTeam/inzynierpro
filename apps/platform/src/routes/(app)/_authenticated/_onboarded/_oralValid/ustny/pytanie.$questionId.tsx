import { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralQuestionDetailsQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { OralQuestionDetailsPage } from '~platform/features/oral/OralQuestionDetailsPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/pytanie/$questionId',
)({
  params: {
    parse: params => ({ questionId: Schema.decodeSync(OralQuestionId)(params.questionId) }),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    void queryClient
      .query(
        oralQuestionDetailsQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id, questionId: params.questionId },
        }),
      )
      .catch(constVoid)
  },
  staticData: { backLabel: 'Pytanie' },
  component: OralQuestionDetailsPage,
  head: () => ({ meta: seo({ title: 'Pytanie ustne' }) }),
})

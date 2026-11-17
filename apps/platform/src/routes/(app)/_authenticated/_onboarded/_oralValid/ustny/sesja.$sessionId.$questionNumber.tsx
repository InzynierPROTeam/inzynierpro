import {
  oralSessionQueryOptions,
  oralSessionQuestionQueryOptions,
} from '@inzpro/queries/modules/oral-study/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { OralSessionQuestionPage } from '~platform/features/oralSession/OralSessionQuestionPage'
import { OralSessionQuestionRouteParams } from '~platform/features/oralSession/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/sesja/$sessionId/$questionNumber',
)({
  params: {
    parse: params => Schema.decodeSync(OralSessionQuestionRouteParams)(params),
    stringify: params => ({
      sessionId: params.sessionId,
      questionNumber: String(params.questionNumber),
    }),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const sessionParams = { qualificationPathId: selectedPath.id, sessionId: params.sessionId }

    void Promise.all([
      queryClient.query(
        oralSessionQueryOptions(apiHttpClient, session.user.id, { params: sessionParams }),
      ),
      queryClient.query(
        oralSessionQuestionQueryOptions(apiHttpClient, session.user.id, {
          params: { ...sessionParams, position: params.questionNumber },
        }),
      ),
    ]).catch(constVoid)
  },
  component: OralSessionQuestionPage,
  head: ({ params }) => ({
    meta: seo({ title: `Pytanie ustne ${params.questionNumber}` }),
  }),
})

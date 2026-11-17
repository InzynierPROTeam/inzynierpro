import {
  sessionQueryOptions,
  sessionQuestionQueryOptions,
} from '@inzpro/queries/modules/written-study/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { SessionQuestionPage } from '~platform/features/learningSession/SessionQuestionPage'
import { SessionQuestionRouteParams } from '~platform/features/learningSession/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/sesja/$sessionId/$questionNumber',
)({
  params: {
    parse: params => Schema.decodeSync(SessionQuestionRouteParams)(params),
    stringify: params => ({
      sessionId: params.sessionId,
      questionNumber: String(params.questionNumber),
    }),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const sessionParams = { qualificationPathId: selectedPath.id, sessionId: params.sessionId }

    void Promise.all([
      queryClient.query(
        sessionQueryOptions(apiHttpClient, session.user.id, { params: sessionParams }),
      ),
      queryClient.query(
        sessionQuestionQueryOptions(apiHttpClient, session.user.id, {
          params: { ...sessionParams, position: params.questionNumber },
        }),
      ),
    ]).catch(constVoid)
  },
  component: SessionQuestionPage,
  head: ({ params }) => ({
    meta: seo({ title: `Pytanie ${params.questionNumber}` }),
  }),
})

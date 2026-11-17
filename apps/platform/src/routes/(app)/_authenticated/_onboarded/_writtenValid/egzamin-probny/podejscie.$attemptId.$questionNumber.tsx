import {
  attemptQuestionQueryOptions,
  mockExamAttemptQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { AttemptPage } from '~platform/features/mockExam/AttemptPage'
import { AttemptQuestionRouteParams } from '~platform/features/mockExam/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/egzamin-probny/podejscie/$attemptId/$questionNumber',
)({
  params: {
    parse: params => Schema.decodeSync(AttemptQuestionRouteParams)(params),
    stringify: params => ({
      attemptId: params.attemptId,
      questionNumber: String(params.questionNumber),
    }),
  },
  loader: async ({ context: { queryClient, session, selectedPath }, params }) => {
    const attemptParams = { qualificationPathId: selectedPath.id, attemptId: params.attemptId }

    const attempt = await queryClient.query(
      mockExamAttemptQueryOptions(apiHttpClient, session.user.id, { params: attemptParams }),
    )

    if (attempt?.status === 'abandoned') {
      throw redirect({ to: '/egzamin-probny', replace: true })
    }

    if (attempt?.status === 'finished') {
      throw redirect({
        to: '/egzamin-probny/podejscie/$attemptId/podsumowanie',
        params: { attemptId: params.attemptId },
        replace: true,
      })
    }

    if (attempt?.status !== 'paused') {
      await queryClient.query(
        attemptQuestionQueryOptions(apiHttpClient, session.user.id, {
          params: { ...attemptParams, position: params.questionNumber },
        }),
      )
    }
  },
  component: AttemptPage,
  head: ({ params }) => ({
    meta: seo({ title: `Egzamin próbny – pytanie ${params.questionNumber}` }),
  }),
})

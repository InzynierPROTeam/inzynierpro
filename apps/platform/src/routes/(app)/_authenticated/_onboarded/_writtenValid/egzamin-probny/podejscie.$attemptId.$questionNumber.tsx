import {
  attemptQuestionQueryOptions,
  mockExamAttemptQueryOptions,
} from '@inzpro/queries/modules/mock-exams/queries'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
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
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const attemptParams = { qualificationPathId: selectedPath.id, attemptId: params.attemptId }

    void Promise.all([
      queryClient.query(
        mockExamAttemptQueryOptions(apiHttpClient, session.user.id, { params: attemptParams }),
      ),
      queryClient.query(
        attemptQuestionQueryOptions(apiHttpClient, session.user.id, {
          params: { ...attemptParams, position: params.questionNumber },
        }),
      ),
    ]).catch(constVoid)
  },
  component: AttemptPage,
  head: ({ params }) => ({
    meta: seo({ title: `Egzamin próbny – pytanie ${params.questionNumber}` }),
  }),
})

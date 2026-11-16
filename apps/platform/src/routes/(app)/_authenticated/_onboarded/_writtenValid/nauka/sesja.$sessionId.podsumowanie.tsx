import { reviewStudySession } from '@inzpro/domain/modules/study/study-session'
import {
  reviewPreviewQueryOptions,
  sessionPreviewQueryOptions,
  sessionResultsInfiniteQueryOptions,
  sessionSummaryQueryOptions,
} from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { SessionSummaryPage } from '~platform/features/learningSession/SessionSummaryPage'
import { SessionSummaryRouteParams } from '~platform/features/learningSession/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/sesja/$sessionId/podsumowanie',
)({
  params: {
    parse: params => Schema.decodeSync(SessionSummaryRouteParams)(params),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const sessionParams = { qualificationPathId: selectedPath.id, sessionId: params.sessionId }

    void Promise.all([
      queryClient
        .query(
          sessionSummaryQueryOptions(apiHttpClient, session.user.id, { params: sessionParams }),
        )
        .then(async summary => {
          if (summary === null) {
            return
          }

          const params = { qualificationPathId: selectedPath.id }

          // The next step after a review shows further due reviews of its scope when any remain.
          await (summary.kind === reviewStudySession
            ? queryClient.query(
                reviewPreviewQueryOptions(apiHttpClient, session.user.id, {
                  params,
                  query: { documentId: summary.document?.id },
                }),
              )
            : queryClient.query(
                sessionPreviewQueryOptions(apiHttpClient, session.user.id, {
                  params,
                  query: { fromDocumentId: summary.document?.id },
                }),
              ))
        }),
      queryClient.infiniteQuery(
        sessionResultsInfiniteQueryOptions(apiHttpClient, session.user.id, {
          params: sessionParams,
          query: {},
        }),
      ),
    ]).catch(constVoid)
  },
  staticData: { backLabel: 'Podsumowanie sesji' },
  component: SessionSummaryPage,
  head: () => ({ meta: seo({ title: 'Podsumowanie sesji' }) }),
})

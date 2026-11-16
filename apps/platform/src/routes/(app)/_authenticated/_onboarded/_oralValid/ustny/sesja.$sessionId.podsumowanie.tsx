import {
  oralSessionNextStepQueryOptions,
  oralSessionQuizQueryOptions,
  oralSessionResultsInfiniteQueryOptions,
  oralSessionSummaryQueryOptions,
} from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { OralSessionSummaryPage } from '~platform/features/oralSession/OralSessionSummaryPage'
import { OralSessionSummaryRouteParams } from '~platform/features/oralSession/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/sesja/$sessionId/podsumowanie',
)({
  params: {
    parse: params => Schema.decodeSync(OralSessionSummaryRouteParams)(params),
  },
  loader: ({ context: { queryClient, session, selectedPath }, params }) => {
    const sessionParams = { qualificationPathId: selectedPath.id, sessionId: params.sessionId }

    void Promise.all([
      queryClient.query(
        oralSessionSummaryQueryOptions(apiHttpClient, session.user.id, { params: sessionParams }),
      ),
      queryClient.query(
        oralSessionNextStepQueryOptions(apiHttpClient, session.user.id, {
          params: sessionParams,
        }),
      ),
      queryClient.query(
        oralSessionQuizQueryOptions(apiHttpClient, session.user.id, { params: sessionParams }),
      ),
      queryClient.infiniteQuery(
        oralSessionResultsInfiniteQueryOptions(apiHttpClient, session.user.id, {
          params: sessionParams,
          query: {},
        }),
      ),
    ]).catch(constVoid)
  },
  staticData: { backLabel: 'Podsumowanie sesji ustnej' },
  component: OralSessionSummaryPage,
  head: () => ({ meta: seo({ title: 'Podsumowanie sesji ustnej' }) }),
})

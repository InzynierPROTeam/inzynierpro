import {
  documentsInfiniteQueryOptions,
  latestSessionQueryOptions,
} from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { WrittenStudyPage } from '~platform/features/written/WrittenStudyPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_writtenValid/nauka/')({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    const params = { qualificationPathId: selectedPath.id }

    void Promise.all([
      queryClient.query(
        latestSessionQueryOptions(apiHttpClient, session.user.id, { params, query: {} }),
      ),
      queryClient.infiniteQuery(
        documentsInfiniteQueryOptions(apiHttpClient, session.user.id, { query: {}, params }),
      ),
    ]).catch(constVoid)
  },
  staticData: { backLabel: 'Nauka' },
  component: WrittenStudyPage,
  head: () => ({ meta: seo({ title: 'Nauka' }) }),
})

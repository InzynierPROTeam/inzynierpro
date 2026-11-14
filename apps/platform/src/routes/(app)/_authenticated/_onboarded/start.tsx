import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { latestSessionQueryOptions } from '@inzpro/queries/modules/study'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { createFileRoute } from '@tanstack/react-router'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { StartPage } from '~platform/features/start/StartPage'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/start')({
  loader: ({ context: { queryClient, session, selectedPath } }) => {
    if (hasExamAccess(selectedPath.accessScope, writtenExamAccess)) {
      void queryClient
        .query(
          latestSessionQueryOptions(apiHttpClient, session.user.id, {
            params: { qualificationPathId: selectedPath.id },
            query: {},
          }),
        )
        .catch(constVoid)
    }
  },
  staticData: { backLabel: 'Start' },
  component: StartPage,
  head: () => ({
    meta: seo({ title: 'Start' }),
  }),
})

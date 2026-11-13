import { sessionPreviewQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@inzpro/ui/components/card'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@inzpro/ui/components/empty'
import { Link } from '@tanstack/react-router'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { sessionPreviewRouteApi } from '../utils'
import { SessionPreviewCard, SessionPreviewCardSkeleton } from './SessionPreviewCard'

export const StartLearningSessionSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const search = sessionPreviewRouteApi.useSearch()
  const categoryId = search['akt-prawny']

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/nauka' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={sessionPreviewQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id },
            query: { documentId: categoryId, afterDocumentId: search['obecny-akt-prawny'] },
          })}
          isDataEmpty={preview => preview === null}
          noDataFallback={<EmptySessionPreview />}
        >
          {preview => preview !== null && <SessionPreviewCard preview={preview} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const EmptySessionPreview = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <h1>Zacznij sesję nauki</h1>
      </CardTitle>
      <CardDescription>Wybierz kategorię, z której chcesz się uczyć.</CardDescription>
    </CardHeader>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Brak dostępnych pytań</EmptyTitle>
          <EmptyDescription>
            Wybrana kategoria jest niedostępna lub nie ma kolejnej kategorii do nauki.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={<Link to="/nauka" />}
          >
            Wróć do kategorii
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

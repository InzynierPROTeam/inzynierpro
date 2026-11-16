import type { OralStudySession } from '@inzpro/api-contracts/modules/study/responses'
import { activeStudySession } from '@inzpro/domain/modules/study/study-session'
import {
  latestOralSessionQueryOptions,
  oralSessionPreviewQueryOptions,
} from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Link } from '@tanstack/react-router'
import { Mic2 } from 'lucide-react'
import type React from 'react'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionPreviewCardSkeleton } from '~platform/features/learningSession/components/SessionPreviewCard'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { oralSessionPreviewRouteApi } from '../utils'
import { OralSessionPreviewCard } from './OralSessionPreviewCard'

export const StartOralSessionSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const search = oralSessionPreviewRouteApi.useSearch()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/ustny' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={oralSessionPreviewQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id },
            query: { categoryId: search.kategoria, fromCategoryId: search['obecna-kategoria'] },
          })}
          isDataEmpty={preview => preview === null}
          noDataFallback={<EmptyOralSessionPreview />}
        >
          {preview => (
            <SuspenseQuery
              options={latestOralSessionQueryOptions(apiHttpClient, user.id, {
                params: { qualificationPathId: selectedPath.id },
                query: { categoryId: preview.category.id },
              })}
              isDataEmpty={session => session === null}
              noDataFallback={<OralSessionPreviewCard preview={preview} />}
            >
              {session =>
                session.status === activeStudySession ? (
                  <ActiveOralSessionNotice session={session} />
                ) : (
                  <OralSessionPreviewCard preview={preview} />
                )
              }
            </SuspenseQuery>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type ActiveOralSessionNoticeProps = { session: OralStudySession }

const ActiveOralSessionNotice: React.FC<ActiveOralSessionNoticeProps> = ({ session }) => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <Mic2 />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>
            <h1>Masz trwającą sesję</h1>
          </EmptyTitle>
          <EmptyDescription>
            Sesja z kategorii „{session.category.name}” jest w toku. Wróć do niej, aby kontynuować
            od pytania {session.progress.currentQuestion} z {session.progress.total}.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={
              <Link
                to="/ustny/sesja/$sessionId/$questionNumber"
                params={{
                  sessionId: session.id,
                  questionNumber: session.progress.currentQuestion,
                }}
                replace
              />
            }
          >
            Przejdź do sesji
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

const EmptyOralSessionPreview = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <h1>Zacznij sesję nauki ustnej</h1>
      </CardTitle>
      <CardDescription>Wybierz kategorię, z której chcesz się uczyć.</CardDescription>
    </CardHeader>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Brak dostępnych pytań</EmptyTitle>
          <EmptyDescription>
            Wybrana kategoria jest niedostępna lub na Twojej ścieżce nie ma jeszcze pytań ustnych.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={<Link to="/ustny" />}
          >
            Wróć do kategorii
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

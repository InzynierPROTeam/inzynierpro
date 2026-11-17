import type { OralStudySession } from '@inzpro/api-contracts/modules/oral-study/responses'
import { activeStudySession } from '@inzpro/domain/modules/learning/study-session'
import { latestOralSessionQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionTileContentSkeleton } from '~platform/features/learningSession/components/LatestSessionContent'
import { SessionProgress } from '~platform/features/learningSession/components/SessionProgress'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { ContinueOralSessionButton } from './ContinueOralSessionButton'

export const LatestOralSessionContent = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper fallback={<SessionTileContentSkeleton />}>
      <SuspenseQuery
        options={latestOralSessionQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: {},
        })}
        isDataEmpty={session => session === null}
        noDataFallback={<FirstOralSessionContent />}
      >
        {session =>
          session.status === activeStudySession ? (
            <ActiveOralSessionContent session={session} />
          ) : (
            <EndedOralSessionContent session={session} />
          )
        }
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const FirstOralSessionContent = () => (
  <>
    <CardContent>
      <p>Przygotuj się do odpowiedzi przed komisją egzaminacyjną.</p>
    </CardContent>
    <CardFooter className="mt-auto">
      <Button
        nativeButton={false}
        render={<Link to="/ustny" />}
      >
        Zacznij naukę
      </Button>
    </CardFooter>
  </>
)

type OralSessionContentProps = { session: OralStudySession }

const ActiveOralSessionContent: React.FC<OralSessionContentProps> = ({ session }) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <CardDescription className="line-clamp-2">
        {session.category?.name ?? 'Wszystkie kategorie'}
      </CardDescription>
      <SessionProgress progress={session.progress} />
    </CardContent>
    <CardFooter className="mt-auto">
      <ContinueOralSessionButton session={session}>Kontynuuj</ContinueOralSessionButton>
    </CardFooter>
  </>
)

const EndedOralSessionContent: React.FC<OralSessionContentProps> = ({ session }) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Sesja zakończona</h3>
        <Button
          variant="link"
          size="empty"
          nativeButton={false}
          render={
            <Link
              to="/ustny/sesja/$sessionId/podsumowanie"
              params={{ sessionId: session.id }}
            />
          }
        >
          Zobacz podsumowanie
        </Button>
      </div>
      <CardDescription className="line-clamp-2">
        {session.category?.name ?? 'Wszystkie kategorie'}
      </CardDescription>
      <SessionProgress progress={session.progress} />
    </CardContent>
    <CardFooter className="mt-auto">
      <Button
        nativeButton={false}
        render={
          <Link
            to="/ustny/start"
            search={{ 'obecna-kategoria': session.category?.id }}
          />
        }
      >
        Kontynuuj naukę
      </Button>
    </CardFooter>
  </>
)

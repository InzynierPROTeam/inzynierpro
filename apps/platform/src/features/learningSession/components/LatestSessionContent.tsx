import type { LatestStudySession } from '@inzpro/api-contracts/modules/study/responses'
import { activeStudySession } from '@inzpro/domain/modules/study/study-session'
import { latestSessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { ProgressSkeleton } from '@inzpro/ui/components/progress'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { ContinueSessionButton } from './ContinueSessionButton'
import { SessionProgress } from './SessionProgress'
import { SessionSummaryLink } from './SessionSummaryLink'

export const LatestSessionContent = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper fallback={<SessionTileContentSkeleton />}>
      <SuspenseQuery
        options={latestSessionQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: {},
        })}
        isDataEmpty={session => session === null}
        noDataFallback={<FirstSessionContent />}
      >
        {session =>
          session.status === activeStudySession ? (
            <ActiveSessionContent session={session} />
          ) : (
            <EndedSessionContent session={session} />
          )
        }
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const FirstSessionContent = () => (
  <>
    <CardContent>
      <p>Czas rozpocząć naukę do egzaminu pisemnego!</p>
    </CardContent>
    <CardFooter className="mt-auto">
      <Button
        nativeButton={false}
        render={<Link to="/nauka/start" />}
      >
        Zacznij naukę
      </Button>
    </CardFooter>
  </>
)

type SessionContentProps = { session: LatestStudySession }

const ActiveSessionContent: React.FC<SessionContentProps> = ({ session }) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <CardDescription className="line-clamp-2">{session.document.title}</CardDescription>
      <SessionProgress progress={session.progress} />
    </CardContent>
    <CardFooter className="mt-auto">
      <ContinueSessionButton session={session}>Kontynuuj</ContinueSessionButton>
    </CardFooter>
  </>
)

const EndedSessionContent: React.FC<SessionContentProps> = ({ session }) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Sesja zakończona</h3>
        <SessionSummaryLink sessionId={session.id} />
      </div>
      <CardDescription className="line-clamp-2">{session.document.title}</CardDescription>
      <SessionProgress progress={session.progress} />
    </CardContent>
    <CardFooter className="mt-auto">
      <Button
        nativeButton={false}
        render={
          <Link
            to="/nauka/start"
            search={{ 'obecny-akt-prawny': session.document.id }}
          />
        }
      >
        Kontynuuj naukę
      </Button>
    </CardFooter>
  </>
)

type SessionTileContentSkeletonProps = {
  // The disabled action stands in for the loaded one, so it must not repeat another card's label.
  actionLabel?: string
}

export const SessionTileContentSkeleton: React.FC<SessionTileContentSkeletonProps> = ({
  actionLabel = 'Kontynuuj',
}) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <TextSkeleton
        size="sm"
        className="max-w-80"
      />
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <TextSkeleton
            size="sm"
            className="w-14"
          />
          <TextSkeleton
            size="sm"
            className="w-10"
          />
        </div>
        <ProgressSkeleton size="sm" />
      </div>
    </CardContent>
    <CardFooter className="mt-auto">
      <Button disabled>{actionLabel}</Button>
    </CardFooter>
  </>
)

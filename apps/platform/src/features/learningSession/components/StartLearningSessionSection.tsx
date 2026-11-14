import type { StudySession } from '@inzpro/api-contracts/modules/study/responses'
import { activeStudySession } from '@inzpro/domain/modules/study/study-session'
import {
  latestSessionQueryOptions,
  sessionPreviewQueryOptions,
} from '@inzpro/queries/modules/study'
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
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Link } from '@tanstack/react-router'
import { BookOpenCheck } from 'lucide-react'
import type React from 'react'
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
          {preview => (
            <SuspenseQuery
              options={latestSessionQueryOptions(apiHttpClient, user.id, {
                params: { qualificationPathId: selectedPath.id },
                query: { documentId: preview.document.id },
              })}
              // Without an active session of this category the preview offers to start one.
              isDataEmpty={() => false}
            >
              {session =>
                session?.status === activeStudySession ? (
                  <ActiveSessionNotice session={session} />
                ) : (
                  <SessionPreviewCard preview={preview} />
                )
              }
            </SuspenseQuery>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type ActiveSessionNoticeProps = { session: StudySession }

// Reached only by typing the URL: the app links an active session straight to its question.
const ActiveSessionNotice: React.FC<ActiveSessionNoticeProps> = ({ session }) => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <BookOpenCheck />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>
            <h1>Masz trwającą sesję</h1>
          </EmptyTitle>
          <EmptyDescription>
            Sesja z tej kategorii jest w toku. Wróć do niej, aby kontynuować od pytania{' '}
            {session.progress.currentQuestion} z {session.progress.total}.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={
              <Link
                to="/nauka/sesja/$sessionId/$questionNumber"
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

import type { StudySession } from '@inzpro/api-contracts/modules/study/responses'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { activeStudySession } from '@inzpro/domain/modules/study/study-session'
import { latestSessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { ContinueSessionButton } from './ContinueSessionButton'
import { SessionTileContentSkeleton } from './LatestSessionContent'
import { SessionProgress } from './SessionProgress'
import { SessionSummaryLink } from './SessionSummaryLink'

type DocumentSessionContentProps = {
  documentId: ReferenceDocumentId
  availableQuestionCount: QuestionCount
}

/** Card body for the learner's latest session of one category; the card belongs to the caller. */
export const DocumentSessionContent: React.FC<DocumentSessionContentProps> = ({
  documentId,
  availableQuestionCount,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper fallback={<SessionTileContentSkeleton />}>
      <SuspenseQuery
        options={latestSessionQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: { documentId },
        })}
        isDataEmpty={session => session === null}
        noDataFallback={
          <FirstDocumentSessionContent
            documentId={documentId}
            availableQuestionCount={availableQuestionCount}
          />
        }
      >
        {session =>
          session.status === activeStudySession ? (
            <ActiveDocumentSessionContent session={session} />
          ) : (
            <EndedDocumentSessionContent
              session={session}
              documentId={documentId}
            />
          )
        }
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const FirstDocumentSessionContent: React.FC<DocumentSessionContentProps> = ({
  documentId,
  availableQuestionCount,
}) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <h3 className="font-semibold">Rozpocznij pierwszą sesję</h3>
      <CardDescription>
        {availableQuestionCount === 0
          ? 'Pytania dla tej kategorii nie są jeszcze dostępne.'
          : 'Przejdź do szczegółów sesji, aby przygotować się do nauki z tej kategorii.'}
      </CardDescription>
    </CardContent>
    <CardFooter className="mt-auto">
      <StartDocumentSessionButton
        documentId={documentId}
        disabled={availableQuestionCount === 0}
      >
        Zacznij naukę
      </StartDocumentSessionButton>
    </CardFooter>
  </>
)

type ActiveDocumentSessionContentProps = { session: StudySession }

const ActiveDocumentSessionContent: React.FC<ActiveDocumentSessionContentProps> = ({ session }) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <CardDescription>Dokończ swoją sesję</CardDescription>
      <SessionProgress progress={session.progress} />
    </CardContent>
    <CardFooter className="mt-auto">
      <ContinueSessionButton session={session}>Kontynuuj</ContinueSessionButton>
    </CardFooter>
  </>
)

type EndedDocumentSessionContentProps = {
  session: StudySession
  documentId: ReferenceDocumentId
}

const EndedDocumentSessionContent: React.FC<EndedDocumentSessionContentProps> = ({
  session,
  documentId,
}) => (
  <>
    <CardContent className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardDescription>Sesja zakończona</CardDescription>
        <SessionSummaryLink sessionId={session.id} />
      </div>
      <SessionProgress progress={session.progress} />
    </CardContent>
    <CardFooter className="mt-auto">
      <StartDocumentSessionButton documentId={documentId}>
        Zacznij nową sesję
      </StartDocumentSessionButton>
    </CardFooter>
  </>
)

type StartDocumentSessionButtonProps = {
  documentId: ReferenceDocumentId
  disabled?: boolean
  children: React.ReactNode
}

const StartDocumentSessionButton: React.FC<StartDocumentSessionButtonProps> = ({
  documentId,
  disabled,
  children,
}) => (
  <Button
    nativeButton={false}
    disabled={disabled}
    render={
      <Link
        to="/nauka/start"
        search={{ 'akt-prawny': documentId }}
      />
    }
  >
    {children}
  </Button>
)

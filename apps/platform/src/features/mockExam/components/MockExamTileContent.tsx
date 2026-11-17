import type { MockExamPreview } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { mockExamPreviewQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionTileContentSkeleton } from '~platform/features/learningSession/components/LatestSessionContent'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { unavailableMessages } from '../utils'
import { ResumeMockExamButton } from './ResumeMockExamButton'

export const MockExamTileContent = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper
      fallback={<SessionTileContentSkeleton actionLabel="Przejdź do egzaminu" />}
    >
      <SuspenseQuery
        options={mockExamPreviewQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
        })}
        isDataEmpty={() => false}
      >
        {preview => <MockExamPreviewContent preview={preview} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type MockExamPreviewContentProps = { preview: MockExamPreview }

const MockExamPreviewContent: React.FC<MockExamPreviewContentProps> = ({
  preview: { blueprint, unavailableReason, unfinishedAttempt },
}) => {
  if (unfinishedAttempt !== null) {
    return (
      <>
        <CardContent>
          <CardDescription>Masz rozpoczęty egzamin próbny.</CardDescription>
        </CardContent>
        <CardFooter className="mt-auto">
          <ResumeMockExamButton attemptId={unfinishedAttempt.id} />
        </CardFooter>
      </>
    )
  }

  if (unavailableReason !== null) {
    return (
      <CardContent>
        <CardDescription>{unavailableMessages[unavailableReason]}</CardDescription>
      </CardContent>
    )
  }

  if (blueprint === null) {
    return null
  }

  return (
    <>
      <CardContent className="flex flex-col gap-2">
        <p>
          {blueprint.questionCount} pytań • {blueprint.durationMinutes} min
        </p>
        <CardDescription>
          Sprawdź się jak na egzaminie: zaliczenie od {blueprint.passThreshold} poprawnych
          odpowiedzi.
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={<Link to="/egzamin-probny" />}
        >
          Przejdź do egzaminu
        </Button>
      </CardFooter>
    </>
  )
}

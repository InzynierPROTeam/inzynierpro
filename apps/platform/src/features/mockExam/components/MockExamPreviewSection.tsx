import type { MockExamPreview } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { mockExamPreviewQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { Clock, List, Target } from 'lucide-react'
import type React from 'react'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/features/learningSession/components/SessionDetails'
import { SessionPreviewCardSkeleton } from '~platform/features/learningSession/components/SessionPreviewCardSkeleton'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { unavailableMessages } from '../utils'
import { ResumeMockExamButton } from './ResumeMockExamButton'
import { StartMockExamButton } from './StartMockExamButton'

export const MockExamPreviewSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/egzamin-probny' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={mockExamPreviewQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id },
          })}
          isDataEmpty={() => false}
        >
          {preview => <MockExamPreviewCard preview={preview} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type MockExamPreviewCardProps = { preview: MockExamPreview }

const MockExamPreviewCard: React.FC<MockExamPreviewCardProps> = ({ preview }) => {
  const { blueprint, unavailableReason, unfinishedAttempt } = preview

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Egzamin próbny</h1>
        </CardTitle>
        <CardDescription>
          {unavailableReason === null
            ? 'Pytania losujemy z dokumentów każdej części egzaminu. Poprawne odpowiedzi zobaczysz dopiero po zakończeniu.'
            : unavailableMessages[unavailableReason]}
        </CardDescription>
      </CardHeader>
      {blueprint !== null && (
        <CardContent className="flex flex-col gap-8">
          <SessionDetails>
            <SessionPathDetail />
            <SessionDetail
              icon={<Clock />}
              label="Czas"
            >
              {blueprint.durationMinutes} min
            </SessionDetail>
            <SessionDetail
              icon={<List />}
              label="Liczba pytań"
            >
              {blueprint.questionCount}
            </SessionDetail>
            <SessionDetail
              icon={<Target />}
              label="Próg zaliczenia"
            >
              {blueprint.passThreshold} z {blueprint.questionCount} poprawnych odpowiedzi
            </SessionDetail>
          </SessionDetails>
          <section
            aria-labelledby="mock-exam-sections"
            className="flex flex-col gap-4"
          >
            <h2
              id="mock-exam-sections"
              className="font-medium"
            >
              Części egzaminu
            </h2>
            <ol className="flex flex-col gap-3">
              {blueprint.sections.map(section => (
                <li
                  key={section.position}
                  className="flex flex-col gap-1"
                >
                  <span>
                    {section.name}: {section.questionCount} pytań
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {section.documents.map(document => document.title).join(', ')}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </CardContent>
      )}
      {(unfinishedAttempt !== null || unavailableReason === null) && (
        <CardFooter>
          {unfinishedAttempt === null ? (
            <StartMockExamButton />
          ) : (
            <ResumeMockExamButton attemptId={unfinishedAttempt.id} />
          )}
        </CardFooter>
      )}
    </Card>
  )
}

import type {
  ReviewPreview,
  SessionCountSettings,
  StudySession,
} from '@inzpro/api-contracts/modules/study/responses'
import { reviewPreviewQueryOptions, reviewSessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { BookOpenCheck, CalendarCheck, List, Scale } from 'lucide-react'
import type React from 'react'
import { BackLink } from '~platform/components/BackLink'
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/components/session/SessionDetails'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { QuestionCountDialog } from '~platform/features/learningSession/components/QuestionCountDialog'
import { SessionPreviewCardSkeleton } from '~platform/features/learningSession/components/SessionPreviewCard'
import { getSessionQuestionCount } from '~platform/features/learningSession/utils'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { noDueReviewsMessage, reviewPreviewRouteApi } from '../utils'
import { StartReviewSessionButton } from './StartReviewSessionButton'

export const ReviewPreviewSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const search = reviewPreviewRouteApi.useSearch()

  const req = {
    params: { qualificationPathId: selectedPath.id },
    query: { documentId: search['akt-prawny'] },
  }

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/start' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={reviewSessionQueryOptions(apiHttpClient, user.id, req)}
          isDataEmpty={session => session === null}
          noDataFallback={
            <SuspenseQuery
              options={reviewPreviewQueryOptions(apiHttpClient, user.id, req)}
              isDataEmpty={preview => preview === null}
              noDataFallback={<UnavailableReviews />}
            >
              {preview =>
                preview.settings === null ? (
                  <NothingDue preview={preview} />
                ) : (
                  <ReviewPreviewCard
                    preview={preview}
                    settings={preview.settings}
                  />
                )
              }
            </SuspenseQuery>
          }
        >
          {session => <ActiveReviewNotice session={session} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type ReviewPreviewCardProps = { preview: ReviewPreview; settings: SessionCountSettings }

const ReviewPreviewCard: React.FC<ReviewPreviewCardProps> = ({ preview, settings }) => {
  const search = reviewPreviewRouteApi.useSearch()
  const navigate = reviewPreviewRouteApi.useNavigate()
  const count = getSessionQuestionCount(settings, search['liczba-pytan'])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Zacznij powtórkę</h1>
        </CardTitle>
        <CardDescription>
          Powtórka obejmuje pytania, których termin powtórki już minął, zaczynając od najbardziej
          zaległych. Możesz ją przerwać w dowolnym momencie i wrócić do niej później.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SessionDetails>
          <SessionPathDetail />
          <SessionDetail
            icon={<Scale />}
            label="Kategoria"
          >
            {preview.document?.title ?? 'Wszystkie kategorie'}
          </SessionDetail>
          <SessionDetail
            icon={<List />}
            label="Liczba pytań"
          >
            {count}
            {settings.canChangeQuestionCount && (
              <QuestionCountDialog
                settings={settings}
                count={count}
                onCountChange={questionCount =>
                  navigate({
                    search: previous => ({ ...previous, 'liczba-pytan': questionCount }),
                    replace: true,
                  })
                }
              />
            )}
          </SessionDetail>
        </SessionDetails>
      </CardContent>
      <CardFooter>
        <StartReviewSessionButton
          documentId={preview.document?.id}
          questionCount={count}
        />
      </CardFooter>
    </Card>
  )
}

type NothingDueProps = { preview: ReviewPreview }

const NothingDue: React.FC<NothingDueProps> = ({ preview }) => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <CalendarCheck />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>
            <h1>Brak pytań do powtórki</h1>
          </EmptyTitle>
          <EmptyDescription>{noDueReviewsMessage(preview.nextDueAt)}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            nativeButton={false}
            render={<Link to="/nauka/start" />}
          >
            Ucz się dalej
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

type ActiveReviewNoticeProps = { session: StudySession }

// Reached only by typing the URL: the app links an unfinished review straight to its question.
const ActiveReviewNotice: React.FC<ActiveReviewNoticeProps> = ({ session }) => (
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
            <h1>Masz trwającą powtórkę</h1>
          </EmptyTitle>
          <EmptyDescription>
            Wróć do niej, aby kontynuować od pytania {session.progress.currentQuestion} z{' '}
            {session.progress.total}.
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
            Przejdź do powtórki
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

const UnavailableReviews = () => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1>Powtórka niedostępna</h1>
          </EmptyTitle>
          <EmptyDescription>Wybrana kategoria nie należy do Twojej ścieżki.</EmptyDescription>
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

import type {
  OralReviewPreview,
  SessionCountSettings,
  OralStudySession,
} from '@inzpro/api-contracts/modules/study/responses'
import {
  oralReviewPreviewQueryOptions,
  oralReviewSessionQueryOptions,
} from '@inzpro/queries/modules/study'
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

import { noDueReviewsMessage, oralReviewPreviewRouteApi } from '../utils'
import { StartOralReviewSessionButton } from './StartOralReviewSessionButton'

export const OralReviewPreviewSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const search = oralReviewPreviewRouteApi.useSearch()

  const req = {
    params: { qualificationPathId: selectedPath.id },
    query: { categoryId: search['kategoria'] },
  }

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/start' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={oralReviewSessionQueryOptions(apiHttpClient, user.id, req)}
          isDataEmpty={session => session === null}
          noDataFallback={
            <SuspenseQuery
              options={oralReviewPreviewQueryOptions(apiHttpClient, user.id, req)}
              isDataEmpty={preview => preview === null}
              noDataFallback={<UnavailableReviews />}
            >
              {preview =>
                preview.settings === null ? (
                  <NothingDue preview={preview} />
                ) : (
                  <OralReviewPreviewCard
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

type OralReviewPreviewCardProps = { preview: OralReviewPreview; settings: SessionCountSettings }

const OralReviewPreviewCard: React.FC<OralReviewPreviewCardProps> = ({ preview, settings }) => {
  const search = oralReviewPreviewRouteApi.useSearch()
  const navigate = oralReviewPreviewRouteApi.useNavigate()
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
            {preview.category?.name ?? 'Wszystkie kategorie'}
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
        <StartOralReviewSessionButton
          categoryId={preview.category?.id}
          questionCount={count}
        />
      </CardFooter>
    </Card>
  )
}

type NothingDueProps = { preview: OralReviewPreview }

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
            render={<Link to="/ustny/start" />}
          >
            Ucz się dalej
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

type ActiveReviewNoticeProps = { session: OralStudySession }

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
                to="/ustny/sesja/$sessionId/$questionNumber"
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
            render={<Link to="/ustny" />}
          >
            Wróć do kategorii
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

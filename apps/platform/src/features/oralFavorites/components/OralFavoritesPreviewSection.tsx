import type { SessionCountSettings } from '@inzpro/api-contracts/modules/learning/responses'
import type {
  OralFavoritesPreview,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import {
  oralFavoritesPreviewQueryOptions,
  oralFavoritesSessionQueryOptions,
} from '@inzpro/queries/modules/oral-study/queries'
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
import { BookOpenCheck, List, Scale, Star } from 'lucide-react'
import type React from 'react'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { QuestionCountDialog } from '~platform/features/learningSession/components/QuestionCountDialog'
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/features/learningSession/components/SessionDetails'
import { SessionPreviewCardSkeleton } from '~platform/features/learningSession/components/SessionPreviewCardSkeleton'
import { getSessionQuestionCount } from '~platform/features/learningSession/utils/session-question-count'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import {
  oralFavoritesPreviewRouteApi,
  noOralFavoritesMessage,
} from '~platform/features/oralFavorites/utils'
import { apiHttpClient } from '~platform/lib/api-client'

import { StartOralFavoritesSessionButton } from './StartOralFavoritesSessionButton'

export const OralFavoritesPreviewSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = {
    params: { qualificationPathId: selectedPath.id },
  }

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/start' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={oralFavoritesSessionQueryOptions(apiHttpClient, user.id, req)}
          isDataEmpty={session => session === null}
          noDataFallback={
            <SuspenseQuery
              options={oralFavoritesPreviewQueryOptions(apiHttpClient, user.id, req)}
              isDataEmpty={preview => preview === null}
              noDataFallback={<UnavailableOralFavorites />}
            >
              {preview =>
                preview.settings === null ? (
                  <NoOralFavorites />
                ) : (
                  <OralFavoritesPreviewCard
                    preview={preview}
                    settings={preview.settings}
                  />
                )
              }
            </SuspenseQuery>
          }
        >
          {session => <ActiveOralFavoritesNotice session={session} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type OralFavoritesPreviewCardProps = {
  preview: OralFavoritesPreview
  settings: SessionCountSettings
}

const OralFavoritesPreviewCard: React.FC<OralFavoritesPreviewCardProps> = ({
  preview,
  settings,
}) => {
  const search = oralFavoritesPreviewRouteApi.useSearch()
  const navigate = oralFavoritesPreviewRouteApi.useNavigate()
  const count = getSessionQuestionCount(settings, search['liczba-pytan'])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Zacznij sesję ulubionych</h1>
        </CardTitle>
        <CardDescription>
          Sesja obejmuje pytania oznaczone przez Ciebie jako ulubione z wybranego zakresu, w
          kolejności katalogu. Możesz ją przerwać w dowolnym momencie i wrócić do niej później.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SessionDetails>
          <SessionPathDetail />
          <SessionDetail
            icon={<Scale />}
            label="Kategoria"
          >
            Wszystkie kategorie
          </SessionDetail>
          <SessionDetail
            icon={<Star />}
            label="Ulubione pytania"
          >
            {preview.favoriteQuestionCount}
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
        <StartOralFavoritesSessionButton questionCount={count} />
      </CardFooter>
    </Card>
  )
}

const NoOralFavorites = () => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <Star />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>
            <h1>Brak ulubionych pytań</h1>
          </EmptyTitle>
          <EmptyDescription>{noOralFavoritesMessage}</EmptyDescription>
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

type ActiveOralFavoritesNoticeProps = { session: OralStudySession }

const ActiveOralFavoritesNotice: React.FC<ActiveOralFavoritesNoticeProps> = ({ session }) => (
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
            <h1>Masz trwającą sesję ulubionych</h1>
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
            Przejdź do sesji
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

const UnavailableOralFavorites = () => (
  <Card>
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1>Ulubione niedostępne</h1>
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

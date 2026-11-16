import type {
  FavoritesPreview,
  SessionCountSettings,
  StudySession,
} from '@inzpro/api-contracts/modules/study/responses'
import {
  favoritesPreviewQueryOptions,
  favoritesSessionQueryOptions,
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
import { BookOpenCheck, List, Scale, Star } from 'lucide-react'
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

import { favoritesPreviewRouteApi, noFavoritesMessage } from '../utils'
import { StartFavoritesSessionButton } from './StartFavoritesSessionButton'

export const FavoritesPreviewSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const search = favoritesPreviewRouteApi.useSearch()

  const req = {
    params: { qualificationPathId: selectedPath.id },
    query: { documentId: search['akt-prawny'] },
  }

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/start' }} />
      <SuspenseQueryWrapper fallback={<SessionPreviewCardSkeleton />}>
        <SuspenseQuery
          options={favoritesSessionQueryOptions(apiHttpClient, user.id, req)}
          isDataEmpty={session => session === null}
          noDataFallback={
            <SuspenseQuery
              options={favoritesPreviewQueryOptions(apiHttpClient, user.id, req)}
              isDataEmpty={preview => preview === null}
              noDataFallback={<UnavailableFavorites />}
            >
              {preview =>
                preview.settings === null ? (
                  <NoFavorites />
                ) : (
                  <FavoritesPreviewCard
                    preview={preview}
                    settings={preview.settings}
                  />
                )
              }
            </SuspenseQuery>
          }
        >
          {session => <ActiveFavoritesNotice session={session} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type FavoritesPreviewCardProps = { preview: FavoritesPreview; settings: SessionCountSettings }

const FavoritesPreviewCard: React.FC<FavoritesPreviewCardProps> = ({ preview, settings }) => {
  const search = favoritesPreviewRouteApi.useSearch()
  const navigate = favoritesPreviewRouteApi.useNavigate()
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
            {preview.document?.title ?? 'Wszystkie kategorie'}
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
        <StartFavoritesSessionButton
          documentId={preview.document?.id}
          questionCount={count}
        />
      </CardFooter>
    </Card>
  )
}

const NoFavorites = () => (
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
          <EmptyDescription>{noFavoritesMessage}</EmptyDescription>
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

type ActiveFavoritesNoticeProps = { session: StudySession }

// Reached only by typing the URL: the app links an unfinished favourites session straight to its question.
const ActiveFavoritesNotice: React.FC<ActiveFavoritesNoticeProps> = ({ session }) => (
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

const UnavailableFavorites = () => (
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
            render={<Link to="/nauka" />}
          >
            Wróć do kategorii
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
)

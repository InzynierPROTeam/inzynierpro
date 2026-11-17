import type { FavoritesPreview } from '@inzpro/api-contracts/modules/written-study/responses'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  favoritesPreviewQueryOptions,
  favoritesSessionQueryOptions,
} from '@inzpro/queries/modules/written-study/queries'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { ContinueSessionButton } from '~platform/features/learningSession/components/ContinueSessionButton'
import { SessionTileContentSkeleton } from '~platform/features/learningSession/components/LatestSessionContent'
import { SessionProgress } from '~platform/features/learningSession/components/SessionProgress'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { noFavoritesMessage } from '../utils'

type FavoritesTileContentProps = {
  documentId?: ReferenceDocumentId
}

export const FavoritesTileContent: React.FC<FavoritesTileContentProps> = ({ documentId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = { params: { qualificationPathId: selectedPath.id }, query: { documentId } }

  return (
    <SuspenseQueryWrapper
      fallback={<SessionTileContentSkeleton actionLabel="Ucz się ulubionych" />}
    >
      <SuspenseQuery
        options={favoritesSessionQueryOptions(apiHttpClient, user.id, req)}
        isDataEmpty={session => session === null}
        noDataFallback={
          <SuspenseQuery
            options={favoritesPreviewQueryOptions(apiHttpClient, user.id, req)}
            isDataEmpty={preview => preview === null}
            noDataFallback={<NoFavoritesContent />}
          >
            {preview => <FavoritesPreviewContent preview={preview} />}
          </SuspenseQuery>
        }
      >
        {session => (
          <>
            <CardContent className="flex flex-col gap-2">
              <CardDescription>Dokończ sesję ulubionych</CardDescription>
              <SessionProgress progress={session.progress} />
            </CardContent>
            <CardFooter className="mt-auto">
              <ContinueSessionButton session={session}>Kontynuuj sesję</ContinueSessionButton>
            </CardFooter>
          </>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type FavoritesPreviewContentProps = { preview: FavoritesPreview }

const FavoritesPreviewContent: React.FC<FavoritesPreviewContentProps> = ({ preview }) =>
  preview.settings !== null ? (
    <>
      <CardContent className="flex flex-col gap-2">
        <p>Ulubione pytania: {preview.favoriteQuestionCount}</p>
        <CardDescription>Wróć do pytań oznaczonych gwiazdką.</CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={
            <Link
              to="/nauka/ulubione"
              search={{ 'akt-prawny': preview.document?.id }}
            />
          }
        >
          Ucz się ulubionych
        </Button>
      </CardFooter>
    </>
  ) : (
    <CardContent>
      <CardDescription>{noFavoritesMessage}</CardDescription>
    </CardContent>
  )

const NoFavoritesContent = () => (
  <CardContent>
    <CardDescription>Ulubione z tej kategorii nie są dostępne.</CardDescription>
  </CardContent>
)

import type { OralFavoritesPreview } from '@inzpro/api-contracts/modules/study/responses'
import {
  oralFavoritesPreviewQueryOptions,
  oralFavoritesSessionQueryOptions,
} from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionTileContentSkeleton } from '~platform/features/learningSession/components/LatestSessionContent'
import { SessionProgress } from '~platform/features/learningSession/components/SessionProgress'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { ContinueOralSessionButton } from '~platform/features/oralSession/components/ContinueOralSessionButton'
import { apiHttpClient } from '~platform/lib/api-client'

import { noOralFavoritesMessage } from '../utils'

export const OralFavoritesTileContent = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = { params: { qualificationPathId: selectedPath.id } }

  return (
    <SuspenseQueryWrapper
      fallback={<SessionTileContentSkeleton actionLabel="Ucz się ulubionych" />}
    >
      <SuspenseQuery
        options={oralFavoritesSessionQueryOptions(apiHttpClient, user.id, req)}
        isDataEmpty={session => session === null}
        noDataFallback={
          <SuspenseQuery
            options={oralFavoritesPreviewQueryOptions(apiHttpClient, user.id, req)}
            isDataEmpty={preview => preview === null}
            noDataFallback={<NoOralFavoritesContent />}
          >
            {preview => <OralFavoritesPreviewContent preview={preview} />}
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
              <ContinueOralSessionButton session={session}>
                Kontynuuj sesję
              </ContinueOralSessionButton>
            </CardFooter>
          </>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type OralFavoritesPreviewContentProps = { preview: OralFavoritesPreview }

const OralFavoritesPreviewContent: React.FC<OralFavoritesPreviewContentProps> = ({ preview }) =>
  preview.settings !== null ? (
    <>
      <CardContent className="flex flex-col gap-2">
        <p>Ulubione pytania: {preview.favoriteQuestionCount}</p>
        <CardDescription>Wróć do pytań oznaczonych gwiazdką.</CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={<Link to="/ustny/ulubione" />}
        >
          Ucz się ulubionych
        </Button>
      </CardFooter>
    </>
  ) : (
    <CardContent>
      <CardDescription>{noOralFavoritesMessage}</CardDescription>
    </CardContent>
  )

const NoOralFavoritesContent = () => (
  <CardContent>
    <CardDescription>Ulubione z tej kategorii nie są dostępne.</CardDescription>
  </CardContent>
)

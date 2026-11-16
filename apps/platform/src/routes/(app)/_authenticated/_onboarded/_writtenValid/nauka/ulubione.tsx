import {
  favoritesPreviewQueryOptions,
  favoritesSessionQueryOptions,
} from '@inzpro/queries/modules/study'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { FavoritesStartPage } from '~platform/features/favorites/FavoritesStartPage'
import { FavoritesPreviewSearch } from '~platform/features/favorites/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/ulubione',
)({
  validateSearch: Schema.toStandardSchemaV1(FavoritesPreviewSearch),
  loaderDeps: ({ search }) => ({ documentId: search['akt-prawny'] }),
  loader: ({ context: { queryClient, session, selectedPath }, deps }) => {
    const req = { params: { qualificationPathId: selectedPath.id }, query: deps }

    void Promise.all([
      queryClient.query(favoritesSessionQueryOptions(apiHttpClient, session.user.id, req)),
      queryClient.query(favoritesPreviewQueryOptions(apiHttpClient, session.user.id, req)),
    ]).catch(constVoid)
  },
  staticData: { backLabel: 'Ulubione' },
  component: FavoritesStartPage,
  head: () => ({ meta: seo({ title: 'Zacznij sesję ulubionych' }) }),
})

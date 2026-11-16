import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { OralFavoritesStartPage } from '~platform/features/oralSession/OralFavoritesStartPage'
import { OralFavoritesPreviewSearch } from '~platform/features/oralSession/validation'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_oralValid/ustny/ulubione')({
  validateSearch: Schema.toStandardSchemaV1(OralFavoritesPreviewSearch),
  component: OralFavoritesStartPage,
  staticData: { backLabel: 'Ulubione pytania ustne' },
  head: () => ({ meta: seo({ title: 'Ulubione pytania ustne' }) }),
})

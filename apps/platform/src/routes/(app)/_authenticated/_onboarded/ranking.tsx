import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { RankingPage } from '~platform/features/ranking/RankingPage'
import { RankingSearch } from '~platform/features/ranking/validation'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/ranking')({
  validateSearch: Schema.toStandardSchemaV1(RankingSearch),
  staticData: { backLabel: 'Ranking' },
  component: RankingPage,
  head: () => ({
    meta: seo({ title: 'Ranking' }),
  }),
})

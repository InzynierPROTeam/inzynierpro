import { documentQueryOptions } from '@inzpro/queries/modules/study'
import { BackLink } from '~platform/components/BackLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { categoryRouteApi } from '../utils'
import { CategorySessionCard } from './CategorySessionCard'
import { CategorySummaryCard, CategorySummaryCardSkeleton } from './CategorySummaryCard'

export const CategorySummarySection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { id } = categoryRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/nauka' }} />
      <SuspenseQueryWrapper fallback={<CategorySummaryCardSkeleton />}>
        <SuspenseQuery
          options={documentQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, documentId: id },
          })}
          isDataEmpty={() => false}
        >
          {({ document }) => (
            <div className="flex gap-8 @max-3xl:flex-col">
              <CategorySummaryCard document={document} />
              <CategorySessionCard
                categoryId={document.id}
                availableQuestionCount={document.availableQuestionCount}
              />
            </div>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

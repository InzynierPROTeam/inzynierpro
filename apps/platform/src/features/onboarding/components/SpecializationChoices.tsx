import { specializationsQueryOptions } from '@inzpro/queries/modules/qualification-paths/queries'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingOptionsLimit } from '../config'
import { getSpecialtyIcon } from '../utils/icons'
import { ChoiceGridSkeleton, EmptyChoices } from './ChoiceGrid'
import { SelectItem } from './SelectItem'

export const SpecializationChoices = () => (
  <SuspenseQueryWrapper fallback={<ChoiceGridSkeleton count={11} />}>
    <SuspenseQuery
      options={specializationsQueryOptions(apiHttpClient, {
        query: { limit: onboardingOptionsLimit },
      })}
      isDataEmpty={data => data.data.length === 0}
      noDataFallback={<EmptyChoices />}
    >
      {data =>
        data.data.map(choice => (
          <SelectItem
            key={choice.id}
            name={choice.name}
            description={choice.description === null ? undefined : `(${choice.description})`}
            value={choice.id}
            icon={getSpecialtyIcon(choice.code)}
          />
        ))
      }
    </SuspenseQuery>
  </SuspenseQueryWrapper>
)

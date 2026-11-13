import type { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { qualificationScopesQueryOptions } from '@inzpro/queries/modules/qualification-paths'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingOptionsLimit } from '../config'
import { getScopeIcon } from '../utils/icons'
import { ChoiceGridSkeleton, EmptyChoices } from './ChoiceGrid'
import { SelectItem } from './SelectItem'

type ScopeChoicesProps = {
  specializationId: SpecializationId
  qualificationKindId: QualificationKindId
}

export const ScopeChoices: React.FC<ScopeChoicesProps> = ({
  specializationId,
  qualificationKindId,
}) => (
  <SuspenseQueryWrapper fallback={<ChoiceGridSkeleton count={2} />}>
    <SuspenseQuery
      options={qualificationScopesQueryOptions(apiHttpClient, {
        query: { specializationId, qualificationKindId, limit: onboardingOptionsLimit },
      })}
      isDataEmpty={data => data.data.length === 0}
      noDataFallback={<EmptyChoices />}
    >
      {data =>
        data.data.map(choice => (
          <SelectItem
            key={choice.id}
            name={choice.name}
            value={choice.id}
            icon={getScopeIcon(choice.code)}
          />
        ))
      }
    </SuspenseQuery>
  </SuspenseQueryWrapper>
)

import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { qualificationKindsQueryOptions } from '@inzpro/queries/modules/qualification-paths'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingOptionsLimit } from '../config'
import { getQualificationKindIcon } from '../utils/icons'
import { ChoiceGridSkeleton, EmptyChoices } from './ChoiceGrid'
import { SelectItem } from './SelectItem'

type KindChoicesProps = { specializationId: SpecializationId }

export const KindChoices: React.FC<KindChoicesProps> = ({ specializationId }) => (
  <SuspenseQueryWrapper fallback={<ChoiceGridSkeleton count={3} />}>
    <SuspenseQuery
      options={qualificationKindsQueryOptions(apiHttpClient, {
        query: { specializationId, limit: onboardingOptionsLimit },
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
            icon={getQualificationKindIcon(choice.code)}
          />
        ))
      }
    </SuspenseQuery>
  </SuspenseQueryWrapper>
)

import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { examSessionsQueryOptions } from '@inzpro/queries/modules/exam-calendar'
import { formatDate } from '@inzpro/utils/date'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingSessionsLimit } from '../config'
import { getExamCycleIcon } from '../utils/icons'
import { ChoiceGridSkeleton, EmptyChoices } from './ChoiceGrid'
import { SelectItem } from './SelectItem'

type SessionChoicesProps = { specializationId: SpecializationId }

export const SessionChoices: React.FC<SessionChoicesProps> = ({ specializationId }) => (
  <SuspenseQueryWrapper fallback={<ChoiceGridSkeleton count={2} />}>
    <SuspenseQuery
      options={examSessionsQueryOptions(apiHttpClient, {
        query: { specializationId, limit: onboardingSessionsLimit },
      })}
      isDataEmpty={data => data.data.length === 0}
      noDataFallback={<EmptyChoices />}
    >
      {data =>
        data.data.map(choice => (
          <SelectItem
            key={choice.id}
            name={choice.name}
            description={`${choice.isConfirmed ? '' : '~'}${formatDate(choice.writtenAt)}`}
            value={choice.id}
            icon={getExamCycleIcon(choice.writtenAt)}
          />
        ))
      }
    </SuspenseQuery>
  </SuspenseQueryWrapper>
)

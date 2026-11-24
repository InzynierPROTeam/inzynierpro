import { documentSectionsQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { referenceDocumentRouteApi } from '../utils'
import { DocumentContent } from './DocumentContent'

export const DocumentReader = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { code } = referenceDocumentRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={<DocumentReaderSkeleton />}>
      <SuspenseQuery
        options={documentSectionsQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, code },
        })}
        isDataEmpty={() => false}
      >
        {({ sections }) => <DocumentContent sections={sections} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const DocumentReaderSkeleton = () => (
  <div className="flex flex-col gap-3">
    <TextSkeleton
      size="lg"
      className="w-48"
    />
    <TextSkeleton className="max-w-2xl" />
    <TextSkeleton className="max-w-xl" />
    <TextSkeleton className="max-w-2xl" />
  </div>
)

import { ReferenceDocumentNotFound } from '@inzpro/api-contracts/modules/learning-content/errors'
import { fullContentAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import { referenceDocumentQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Schema } from 'effect'
import { FileX } from 'lucide-react'
import { BackLink } from '~platform/components/BackLink'
import {
  DefaultErrorFallback,
  SuspenseQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { referenceDocumentRouteApi } from '../utils'
import { DocumentReader } from './DocumentReader'
import {
  ReferenceDocumentDetails,
  ReferenceDocumentDetailsSkeleton,
} from './ReferenceDocumentDetails'

export const ReferenceDocumentSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { code } = referenceDocumentRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/zrodla' }} />
      <SuspenseQueryWrapper
        fallback={<ReferenceDocumentDetailsSkeleton />}
        errorFallback={props =>
          Schema.is(ReferenceDocumentNotFound)(props.error) ? (
            <ReferenceDocumentUnavailable />
          ) : (
            <DefaultErrorFallback {...props} />
          )
        }
      >
        <SuspenseQuery
          options={referenceDocumentQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, code },
          })}
          isDataEmpty={() => false}
        >
          {({ document }) => (
            <>
              <ReferenceDocumentDetails document={document} />
              {document.edition.availability === fullContentAvailability && <DocumentReader />}
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const ReferenceDocumentUnavailable = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <FileX />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Dokument jest niedostępny</EmptyTitle>
      <EmptyDescription>
        Ten dokument nie należy do Twojej ścieżki albo jego wydanie nie zostało jeszcze
        opublikowane.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)

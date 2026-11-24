import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  documentSectionsQueryOptions,
  referenceDocumentQueryOptions,
} from '@inzpro/queries/modules/learning-content/queries'
import { buttonVariants } from '@inzpro/ui/components/button'
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@inzpro/ui/components/sheet'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import type React from 'react'
import { ExternalLink } from '~platform/components/ExternalLink'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { textKindLabel } from '../utils'
import { DocumentFragment } from './DocumentFragment'

type DocumentFragmentPanelProps = {
  code: ReferenceDocumentCode
  address: DocumentSectionAddress
  label: string
}

export const DocumentFragmentPanel: React.FC<DocumentFragmentPanelProps> = ({
  code,
  address,
  label,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const request = { params: { qualificationPathId: selectedPath.id, code } }

  return (
    <SheetContent>
      <SuspenseQueryWrapper fallback={<DocumentFragmentSkeleton label={label} />}>
        <SuspenseQuery
          options={referenceDocumentQueryOptions(apiHttpClient, user.id, request)}
          isDataEmpty={() => false}
        >
          {({ document }) => (
            <>
              <SheetHeader>
                <SheetTitle>{label}</SheetTitle>
                <SheetDescription render={<div />}>
                  <p className="text-foreground font-medium">{document.title}</p>
                  <p>
                    {document.edition.label} · {textKindLabel(document.edition.textKind)}
                  </p>
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6">
                <SuspenseQuery
                  options={documentSectionsQueryOptions(apiHttpClient, user.id, request)}
                  isDataEmpty={() => false}
                >
                  {({ sections }) => (
                    <DocumentFragment
                      sections={sections}
                      address={address}
                    />
                  )}
                </SuspenseQuery>
              </div>
              <SheetFooter>
                <Link
                  to="/zrodla/$code"
                  params={{ code }}
                  search={{ jednostka: address }}
                  className={buttonVariants()}
                >
                  Otwórz cały dokument
                </Link>
                <ExternalLink
                  href={document.edition.externalUrl}
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Otwórz źródło zewnętrzne
                  <ExternalLinkIcon aria-hidden="true" />
                </ExternalLink>
              </SheetFooter>
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </SheetContent>
  )
}

type DocumentFragmentSkeletonProps = { label: string }

const DocumentFragmentSkeleton: React.FC<DocumentFragmentSkeletonProps> = ({ label }) => (
  <SheetHeader>
    <SheetTitle>{label}</SheetTitle>
    <TextSkeleton className="w-48" />
    <TextSkeleton className="max-w-md" />
    <TextSkeleton className="max-w-sm" />
  </SheetHeader>
)

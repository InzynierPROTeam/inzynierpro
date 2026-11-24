import type { GetReferenceDocumentRes } from '@inzpro/api-client/modules/learning-content'
import { Badge } from '@inzpro/ui/components/badge'
import { buttonVariants } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { formatDate } from '@inzpro/utils/date'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import type React from 'react'
import { ExternalLink } from '~platform/components/ExternalLink'

import { documentKindLabel, textKindLabel } from '../utils'

type ReferenceDocumentDetailsProps = { document: GetReferenceDocumentRes['document'] }

export const ReferenceDocumentDetails: React.FC<ReferenceDocumentDetailsProps> = ({ document }) => (
  <Card>
    <CardHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{documentKindLabel(document.kind)}</Badge>
        <Badge variant="outline-primary">{document.abbreviation}</Badge>
      </div>
      <CardTitle>
        <h1>{document.title}</h1>
      </CardTitle>
      <CardDescription>
        {document.edition.label} · {textKindLabel(document.edition.textKind)} · obowiązuje od{' '}
        {formatDate(document.edition.effectiveFrom)}
      </CardDescription>
    </CardHeader>
    {document.description !== null && (
      <CardContent>
        <p>{document.description}</p>
      </CardContent>
    )}
    <CardFooter>
      <ExternalLink
        href={document.edition.externalUrl}
        className={buttonVariants({ variant: 'outline' })}
      >
        Otwórz źródło zewnętrzne
        <ExternalLinkIcon aria-hidden="true" />
      </ExternalLink>
    </CardFooter>
  </Card>
)

export const ReferenceDocumentDetailsSkeleton = () => (
  <Card>
    <CardHeader>
      <TextSkeleton
        size="sm"
        className="w-40"
      />
      <TextSkeleton
        size="xl"
        leading="snug"
        className="max-w-lg"
      />
      <TextSkeleton
        size="sm"
        className="w-64"
      />
    </CardHeader>
  </Card>
)

import type { GetReferenceDocumentsRes } from '@inzpro/api-client/modules/learning-content'
import { Badge } from '@inzpro/ui/components/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type React from 'react'

import { documentKindLabel } from '../utils'

type ReferenceDocumentItemProps = { document: GetReferenceDocumentsRes['data'][number] }

export const ReferenceDocumentItem: React.FC<ReferenceDocumentItemProps> = ({ document }) => (
  <Item
    variant="background-soft"
    render={
      <Link
        to="/zrodla/$code"
        params={{ code: document.code }}
      />
    }
  >
    <ItemContent>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{documentKindLabel(document.kind)}</Badge>
        <Badge variant="outline-primary">{document.abbreviation}</Badge>
      </div>
      <ItemTitle>
        <h2>{document.title}</h2>
      </ItemTitle>
      <ItemDescription>{document.editionLabel}</ItemDescription>
    </ItemContent>
    <ItemActions>
      <ChevronRight aria-hidden="true" />
    </ItemActions>
  </Item>
)

export const ReferenceDocumentItemSkeleton = () => (
  <Item variant="background-soft">
    <ItemContent>
      <TextSkeleton
        size="sm"
        className="w-32"
      />
      <TextSkeleton
        size="sm"
        leading="snug"
        className="max-w-lg"
      />
      <TextSkeleton
        size="sm"
        className="w-48"
      />
    </ItemContent>
  </Item>
)

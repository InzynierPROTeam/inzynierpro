import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import { Badge } from '@inzpro/ui/components/badge'
import { Button } from '@inzpro/ui/components/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cx } from 'tailwind-variants'

type PackageOrderListProps = {
  documents: ReadonlyArray<DocumentPackageCandidate>
  onMove: (from: number, to: number) => void
  onRestoreDefault: () => void
}

export const PackageOrderList: React.FC<PackageOrderListProps> = ({
  documents,
  onMove,
  onRestoreDefault,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const dropAt = (index: number) => {
    if (draggedIndex !== null) {
      onMove(draggedIndex, index)
    }

    setDraggedIndex(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup
        render={<ol />}
        aria-label="Kolejność dokumentów w pakiecie"
        className="gap-2"
      >
        {documents.map((document, index) => (
          <Item
            key={document.id}
            render={<li />}
            variant="background-soft"
            size="sm"
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={event => event.preventDefault()}
            onDrop={() => dropAt(index)}
            onDragEnd={() => setDraggedIndex(null)}
            className={cx('flex-nowrap', draggedIndex === index && 'opacity-50')}
          >
            <ItemMedia className="text-muted-foreground gap-2 text-sm tabular-nums">
              <GripVertical
                aria-hidden="true"
                className="hidden size-4 cursor-grab md:block"
              />
              {index + 1}.
            </ItemMedia>
            <ItemContent className="gap-1">
              <Badge variant="outline-primary">{document.abbreviation}</Badge>
              <ItemTitle className="line-clamp-2">{document.title}</ItemTitle>
            </ItemContent>
            <ItemActions className="gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Przesuń wyżej: ${document.abbreviation}`}
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Przesuń niżej: ${document.abbreviation}`}
                disabled={index === documents.length - 1}
                onClick={() => onMove(index, index + 1)}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={onRestoreDefault}
      >
        <RotateCcw aria-hidden="true" />
        Przywróć domyślną kolejność
      </Button>
    </div>
  )
}

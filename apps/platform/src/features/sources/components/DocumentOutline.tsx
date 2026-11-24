import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { documentSectionLabel } from '@inzpro/domain/modules/learning-content/document-section-address'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { cx } from 'tailwind-variants'

import { isOutlineUnit, type SectionTree } from '../utils'

type DocumentOutlineProps = { tree: SectionTree }

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({ tree }) => (
  <nav
    aria-label="Spis treści"
    className="flex flex-col gap-3"
  >
    <h2 className="text-sm font-semibold">Spis treści</h2>
    <OutlineList
      tree={tree}
      parent={null}
    />
  </nav>
)

type OutlineListProps = { tree: SectionTree; parent: DocumentSectionAddress | null }

const OutlineList: React.FC<OutlineListProps> = ({ tree, parent }) => {
  const units = (tree.get(parent) ?? []).filter(isOutlineUnit)

  if (units.length === 0) {
    return null
  }

  return (
    <ul className={cx('flex flex-col gap-1 text-sm', parent !== null && 'mt-1 border-l pl-3')}>
      {units.map(section => (
        <li key={section.address}>
          <Link
            from="/zrodla/$code"
            to="."
            search={{ jednostka: section.address }}
            resetScroll={false}
            className="hover:text-primary block rounded-sm py-0.5"
          >
            <span className="font-medium">{documentSectionLabel(section.address)}</span>
            {section.title !== null && (
              <span className="text-muted-foreground"> {section.title}</span>
            )}
          </Link>
          <OutlineList
            tree={tree}
            parent={section.address}
          />
        </li>
      ))}
    </ul>
  )
}

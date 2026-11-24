import type { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  documentSectionLabel,
  documentUnitLabel,
} from '@inzpro/domain/modules/learning-content/document-section-address'
import { RichText } from '@inzpro/ui/components/rich-text'
import type React from 'react'
import { cx } from 'tailwind-variants'

import { useScrollToUnit } from '../hooks/useScrollToUnit'
import { isOutlineUnit, referenceDocumentRouteApi, sectionAnchor, type SectionTree } from '../utils'

type DocumentTextProps = { tree: SectionTree }

export const DocumentText: React.FC<DocumentTextProps> = ({ tree }) => {
  const { jednostka } = referenceDocumentRouteApi.useSearch()

  useScrollToUnit(jednostka)

  return (
    <article
      aria-label="Treść dokumentu"
      className="flex flex-col gap-8"
    >
      {(tree.get(null) ?? []).map(section => (
        <DocumentUnit
          key={section.address}
          section={section}
          tree={tree}
        />
      ))}
    </article>
  )
}

type DocumentUnitProps = { section: DocumentSection; tree: SectionTree }

const DocumentUnit: React.FC<DocumentUnitProps> = ({ section, tree }) => {
  const { jednostka } = referenceDocumentRouteApi.useSearch()
  const outline = isOutlineUnit(section)
  const children = tree.get(section.address) ?? []
  const Heading = section.parentAddress === null ? 'h2' : 'h3'

  return (
    <div
      id={sectionAnchor(section.address)}
      tabIndex={-1}
      data-highlighted={section.address === jednostka}
      className="ring-offset-background data-[highlighted=true]:bg-primary/10 data-[highlighted=true]:ring-primary/40 flex scroll-mt-32 flex-col gap-3 rounded-md outline-none data-[highlighted=true]:ring-2 data-[highlighted=true]:ring-offset-4"
    >
      {outline && (
        <Heading className="text-lg font-semibold">
          {documentSectionLabel(section.address)}
          {section.title !== null && (
            <span className="text-muted-foreground block text-base font-medium">
              {section.title}
            </span>
          )}
        </Heading>
      )}
      {(!outline || section.content !== null) && (
        <div className="flex gap-2">
          {!outline && (
            <span className="shrink-0 font-semibold">{documentUnitLabel(section.address)}</span>
          )}
          {section.content !== null && (
            <RichText
              content={section.content.content}
              assets={section.content.assets}
            />
          )}
        </div>
      )}
      {children.length > 0 && (
        <div className={cx('flex flex-col', outline ? 'gap-6' : 'gap-3 pl-4')}>
          {children.map(child => (
            <DocumentUnit
              key={child.address}
              section={child}
              tree={tree}
            />
          ))}
        </div>
      )}
    </div>
  )
}

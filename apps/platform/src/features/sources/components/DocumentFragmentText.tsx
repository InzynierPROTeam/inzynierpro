import type { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  documentSectionLabel,
  documentUnitLabel,
} from '@inzpro/domain/modules/learning-content/document-section-address'
import { RichText } from '@inzpro/ui/components/rich-text'
import type React from 'react'

import { sectionTree, type SectionTree } from '../utils'

type DocumentFragmentTextProps = { sections: ReadonlyArray<DocumentSection> }

export const DocumentFragmentText: React.FC<DocumentFragmentTextProps> = ({ sections }) => {
  const [unit] = sections

  return unit === undefined ? null : (
    <FragmentUnit
      section={unit}
      label={documentSectionLabel(unit.address)}
      tree={sectionTree(sections)}
    />
  )
}

type FragmentUnitProps = { section: DocumentSection; label: string; tree: SectionTree }

const FragmentUnit: React.FC<FragmentUnitProps> = ({ section, label, tree }) => {
  const children = tree.get(section.address) ?? []

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <span className="shrink-0 font-semibold">{label}</span>
        {section.title !== null && <span className="font-medium">{section.title}</span>}
        {section.content !== null && (
          <RichText
            content={section.content.content}
            assets={section.content.assets}
          />
        )}
      </div>
      {children.length > 0 && (
        <div className="flex flex-col gap-2 ps-4">
          {children.map(child => (
            <FragmentUnit
              key={child.address}
              section={child}
              label={documentUnitLabel(child.address)}
              tree={tree}
            />
          ))}
        </div>
      )}
    </div>
  )
}

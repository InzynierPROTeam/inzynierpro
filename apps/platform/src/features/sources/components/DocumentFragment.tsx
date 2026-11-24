import type { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  type DocumentSectionAddress,
  documentSectionLabel,
} from '@inzpro/domain/modules/learning-content/document-section-address'
import { RichText } from '@inzpro/ui/components/rich-text'
import type React from 'react'

import { DocumentFragmentText } from './DocumentFragmentText'

type DocumentFragmentProps = {
  sections: ReadonlyArray<DocumentSection>
  address: DocumentSectionAddress
}

export const DocumentFragment: React.FC<DocumentFragmentProps> = ({ sections, address }) => {
  const fragment = sections.find(section => section.address === address)

  if (fragment === undefined) {
    return <p role="alert">W tym wydaniu nie ma jednostki {documentSectionLabel(address)}.</p>
  }

  const parent = sections.find(section => section.address === fragment.parentAddress)

  return (
    <div className="flex flex-col gap-4">
      {parent !== undefined && (
        <section
          aria-label="Jednostka nadrzędna"
          className="text-muted-foreground flex flex-col gap-1"
        >
          <p className="font-semibold">
            {documentSectionLabel(parent.address)}
            {parent.title !== null && ` — ${parent.title}`}
          </p>
          {parent.content !== null && (
            <RichText
              content={parent.content.content}
              assets={parent.content.assets}
            />
          )}
        </section>
      )}
      <section
        aria-label="Fragment"
        className="border-primary/40 bg-primary/5 rounded-xl border-s-4 p-4"
      >
        <DocumentFragmentText
          sections={sections.filter(
            section => section.address === address || section.address.startsWith(`${address}/`),
          )}
        />
      </section>
    </div>
  )
}

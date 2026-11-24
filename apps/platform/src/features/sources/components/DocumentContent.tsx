import type { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
import type React from 'react'

import { sectionTree } from '../utils'
import { DocumentOutline } from './DocumentOutline'
import { DocumentText } from './DocumentText'
import { MissingUnitNotice } from './MissingUnitNotice'

type DocumentContentProps = { sections: ReadonlyArray<DocumentSection> }

export const DocumentContent: React.FC<DocumentContentProps> = ({ sections }) => {
  const tree = sectionTree(sections)

  return (
    <div className="grid gap-6 @3xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="@3xl:sticky @3xl:top-32 @3xl:max-h-[calc(100dvh-10rem)] @3xl:self-start @3xl:overflow-y-auto">
        <DocumentOutline tree={tree} />
      </aside>
      <div className="flex min-w-0 flex-col gap-4">
        <MissingUnitNotice sections={sections} />
        <DocumentText tree={tree} />
      </div>
    </div>
  )
}

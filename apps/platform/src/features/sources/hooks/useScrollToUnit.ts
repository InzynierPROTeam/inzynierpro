import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { useEffect } from 'react'

import { sectionAnchor } from '../utils'

export const useScrollToUnit = (address: DocumentSectionAddress | undefined) => {
  useEffect(() => {
    if (address === undefined) {
      return
    }

    const unit = document.getElementById(sectionAnchor(address))

    unit?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    unit?.focus({ preventScroll: true })
  }, [address])
}

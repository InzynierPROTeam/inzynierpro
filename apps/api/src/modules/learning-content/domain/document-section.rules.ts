import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { Option } from 'effect'

import type { DocumentSection } from './reference-document.model.js'

export const inDocumentOrder = (
  siblingOrderedSections: ReadonlyArray<DocumentSection>,
): ReadonlyArray<DocumentSection> => {
  const children = new Map<DocumentSectionAddress | null, Array<DocumentSection>>()

  for (const section of siblingOrderedSections) {
    const parent = Option.getOrNull(section.parentAddress)
    const siblings = children.get(parent)

    if (siblings === undefined) {
      children.set(parent, [section])
    } else {
      siblings.push(section)
    }
  }

  const unitWithDescendants = (section: DocumentSection): ReadonlyArray<DocumentSection> => [
    section,
    ...(children.get(section.address) ?? []).flatMap(unitWithDescendants),
  ]

  return (children.get(null) ?? []).flatMap(unitWithDescendants)
}

export const withSiblingPositions = <Section extends { readonly parentAddress?: string | null }>(
  sections: ReadonlyArray<Section>,
): ReadonlyArray<Section & { readonly position: number }> => {
  const lastPositions = new Map<string | null, number>()

  return sections.map(section => {
    const parent = section.parentAddress ?? null
    const position = (lastPositions.get(parent) ?? 0) + 1

    lastPositions.set(parent, position)

    return { ...section, position }
  })
}

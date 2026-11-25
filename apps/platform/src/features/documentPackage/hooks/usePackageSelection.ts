import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Option } from 'effect'
import { useSyncExternalStore } from 'react'

import { PACKAGE_SELECTION_EVENT_NAME, packageSelectionStore } from '../stores'
import {
  defaultPackageSelection,
  movePackageDocument,
  type PackageSelection,
  reconcilePackageSelection,
  restoreDefaultOrder,
  togglePackageDocument,
} from '../utils'

const subscribe = (callback: () => void) => {
  window.addEventListener(PACKAGE_SELECTION_EVENT_NAME, callback)

  return () => window.removeEventListener(PACKAGE_SELECTION_EVENT_NAME, callback)
}

const noStoredSelection = Option.none<PackageSelection>()

export const usePackageSelection = (
  pathId: QualificationPathId,
  candidates: ReadonlyArray<DocumentPackageCandidate>,
) => {
  const stored = useSyncExternalStore(
    subscribe,
    () => packageSelectionStore.get(pathId),
    () => noStoredSelection,
  )

  const selection = reconcilePackageSelection(
    Option.getOrElse(stored, () => defaultPackageSelection(candidates)),
    candidates,
  )

  const update = (next: PackageSelection) => packageSelectionStore.set(pathId, next)

  return {
    selection,
    toggle: (code: ReferenceDocumentCode) => update(togglePackageDocument(selection, code)),
    move: (from: number, to: number) => update(movePackageDocument(selection, from, to)),
    restoreDefault: () => update(restoreDefaultOrder(selection, candidates)),
  }
}

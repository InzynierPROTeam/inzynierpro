import { getItem, setItem } from '@inzpro/browser-utils/local-storage'
import { appNameKebabCase } from '@inzpro/config/app'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option, Schema } from 'effect'

import type { PackageSelection } from './utils'

export const PACKAGE_SELECTION_EVENT_NAME = 'document_package_selection_update'

const StoredPackageSelection = Schema.fromJsonString(
  Schema.Struct({
    selected: Schema.Array(ReferenceDocumentCode),
    excluded: Schema.Array(ReferenceDocumentCode),
  }),
)

const packageSelectionKey = (pathId: QualificationPathId) =>
  `${appNameKebabCase}.document-package.${pathId}`

const readStoredValue = (key: string) =>
  Effect.try(() => getItem(key)).pipe(
    Effect.orElseSucceed(() => null),
    Effect.runSync,
  )

const decodedSelections = new Map<
  string,
  { readonly value: string | null; readonly selection: Option.Option<PackageSelection> }
>()

export const packageSelectionStore = {
  get: (pathId: QualificationPathId) => {
    const key = packageSelectionKey(pathId)
    const value = readStoredValue(key)
    const cached = decodedSelections.get(key)

    if (cached !== undefined && cached.value === value) {
      return cached.selection
    }

    const selection =
      value === null ? Option.none() : Schema.decodeOption(StoredPackageSelection)(value)

    decodedSelections.set(key, { value, selection })

    return selection
  },
  set: (pathId: QualificationPathId, selection: PackageSelection) => {
    Schema.encodeEffect(StoredPackageSelection)(selection).pipe(
      Effect.flatMap(value => Effect.try(() => setItem(packageSelectionKey(pathId), value))),
      Effect.ignore,
      Effect.runSync,
    )
    window.dispatchEvent(new Event(PACKAGE_SELECTION_EVENT_NAME))
  },
}

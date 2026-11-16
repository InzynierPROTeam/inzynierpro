import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { Option } from 'effect'

import type { SessionCountSettings } from './session-preview.rules.js'
import type { SessionDocument } from './study-document.model.js'

export type FavoritesPreview = {
  readonly qualificationPathId: QualificationPathId
  // None for favourites of the whole path.
  readonly document: Option.Option<SessionDocument>
  readonly favoriteQuestionCount: QuestionCount
  // None when nothing is marked, so no favourites session can start.
  readonly settings: Option.Option<SessionCountSettings>
}

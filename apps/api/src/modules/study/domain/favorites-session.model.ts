import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { Option } from 'effect'

import type { SessionCountSettings } from './session-preview.rules.js'
import type { SessionDocument } from './study-document.model.js'

export type FavoritesPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly document: Option.Option<SessionDocument>
  readonly favoriteQuestionCount: QuestionCount
  readonly settings: Option.Option<SessionCountSettings>
}

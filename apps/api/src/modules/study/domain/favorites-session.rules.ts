import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'

import { type SessionCountSettings, writtenStudySettings } from './session-preview.rules.js'

export const favoritesSessionSettings = (
  favoriteQuestionCount: QuestionCount,
): Option.Option<SessionCountSettings> =>
  favoriteQuestionCount === 0
    ? Option.none()
    : Option.some(writtenStudySettings(favoriteQuestionCount))

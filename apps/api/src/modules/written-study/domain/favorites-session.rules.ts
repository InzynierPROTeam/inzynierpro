import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'
import { type SessionCountSettings } from '~api/modules/learning/domain/session-count.rules.js'
import { writtenStudySettings } from '~api/modules/written-study/domain/session-preview.rules.js'

export const favoritesSessionSettings = (
  favoriteQuestionCount: QuestionCount,
): Option.Option<SessionCountSettings> =>
  favoriteQuestionCount === 0
    ? Option.none()
    : Option.some(writtenStudySettings(favoriteQuestionCount))

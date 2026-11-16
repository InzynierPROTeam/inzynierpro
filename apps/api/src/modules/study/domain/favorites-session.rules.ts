import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'

import { type SessionCountSettings, writtenStudySettings } from './session-preview.rules.js'

/**
 * The counts a favourites session may hold: every marked question by default, changeable above 25
 * like regular study. With nothing marked no session is created (ADR-0002).
 */
export const favoritesSessionSettings = (
  favoriteQuestionCount: QuestionCount,
): Option.Option<SessionCountSettings> =>
  favoriteQuestionCount === 0
    ? Option.none()
    : Option.some(writtenStudySettings(favoriteQuestionCount))

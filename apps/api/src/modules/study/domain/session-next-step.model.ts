import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  continueStudyNextStep,
  reviewNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import type { Option } from 'effect'

import type { SessionPreview } from './session-preview.rules.js'
import type { SessionDocument } from './study-document.model.js'
import type { StudySession } from './study-session.model.js'

/** The one step a finished written session suggests next (ADR-0002). */
export type SessionNextStep =
  | {
      readonly type: typeof reviewNextStep
      // None for a review of the whole path.
      readonly document: Option.Option<SessionDocument>
      readonly dueCount: QuestionCount
    }
  | {
      // The most recently used unfinished regular-study session.
      readonly type: typeof continueStudyNextStep
      readonly session: StudySession
    }
  | {
      readonly type: typeof startStudyNextStep
      readonly preview: SessionPreview
    }

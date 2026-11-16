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

export type SessionNextStep =
  | {
      readonly type: typeof reviewNextStep
      readonly document: Option.Option<SessionDocument>
      readonly dueCount: QuestionCount
    }
  | {
      readonly type: typeof continueStudyNextStep
      readonly session: StudySession
    }
  | {
      readonly type: typeof startStudyNextStep
      readonly preview: SessionPreview
    }

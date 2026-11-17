import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  continueStudyNextStep,
  reviewNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/learning/study-session'
import type { Option } from 'effect'
import type { SessionPreview } from '~api/modules/written-study/domain/session-preview.rules.js'
import type { SessionDocument } from '~api/modules/written-study/domain/study-document.model.js'
import type { StudySession } from '~api/modules/written-study/domain/study-session.model.js'

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

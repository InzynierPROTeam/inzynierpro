import type {
  continueStudyNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'

import type { OralSessionPreview } from './oral-session-preview.rules.js'
import type { OralStudySession } from './oral-study-session.model.js'

export type OralSessionNextStep =
  | {
      readonly type: typeof continueStudyNextStep
      readonly session: OralStudySession
    }
  | {
      readonly type: typeof startStudyNextStep
      readonly preview: OralSessionPreview
    }

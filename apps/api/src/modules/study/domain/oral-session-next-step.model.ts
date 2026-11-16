import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  reviewNextStep,
  continueStudyNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import type { Option } from 'effect'

import type { OralSessionPreview } from './oral-session-preview.rules.js'
import type { OralStudySession } from './oral-study-session.model.js'

export type OralSessionNextStep =
  | {
      readonly type: typeof reviewNextStep
      readonly category: Option.Option<{
        readonly id: OralQuestionCategoryId
        readonly name: string
      }>
      readonly dueQuestionCount: QuestionCount
    }
  | {
      readonly type: typeof continueStudyNextStep
      readonly session: OralStudySession
    }
  | {
      readonly type: typeof startStudyNextStep
      readonly preview: OralSessionPreview
    }

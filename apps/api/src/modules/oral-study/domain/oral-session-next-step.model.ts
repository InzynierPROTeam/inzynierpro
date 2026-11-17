import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  reviewNextStep,
  continueStudyNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/learning/study-session'
import type { Option } from 'effect'
import type { OralSessionPreview } from '~api/modules/oral-study/domain/oral-session-preview.rules.js'
import type { OralStudySession } from '~api/modules/oral-study/domain/oral-study-session.model.js'

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

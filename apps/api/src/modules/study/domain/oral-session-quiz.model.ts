import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type {
  KnowledgeCheckFormat,
  OralKnowledgeCheckOptionId,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  OralQuizCheckPosition,
  OralSessionQuizId,
} from '@inzpro/domain/modules/study/oral-session-quiz'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import type { Option } from 'effect'

export type KnowledgeCheckCandidate = {
  readonly questionId: OralQuestionId
  readonly sessionPosition: SessionQuestionPosition
  readonly oralRevisionId: OralRevisionId
  readonly knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId
  readonly format: KnowledgeCheckFormat
  readonly prompt: string
  readonly optionIds: ReadonlyArray<OralKnowledgeCheckOptionId>
}

export type NewOralSessionQuiz = {
  readonly sessionId: OralStudySessionId
  readonly checks: ReadonlyArray<KnowledgeCheckCandidate>
}

export type OralQuizCheckOption = {
  readonly id: OralKnowledgeCheckOptionId
  readonly text: string
  readonly isCorrect: boolean
}

export type OralQuizAnswer = {
  readonly selectedOptionIds: ReadonlyArray<OralKnowledgeCheckOptionId>
  readonly isCorrect: boolean
  readonly answeredAt: DateTimeUtc
}

export type OralQuizCheck = {
  readonly quizId: OralSessionQuizId
  readonly position: OralQuizCheckPosition
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
  readonly format: KnowledgeCheckFormat
  readonly prompt: string
  readonly explanation: RichContent
  readonly options: ReadonlyArray<OralQuizCheckOption>
  readonly answer: Option.Option<OralQuizAnswer>
}

export type OralSessionQuiz = {
  readonly id: OralSessionQuizId
  readonly sessionId: OralStudySessionId
  readonly checkCount: QuestionCount
  readonly answeredCount: QuestionCount
  readonly formats: ReadonlyArray<KnowledgeCheckFormat>
}

export type OralSessionQuizState = {
  readonly quiz: Option.Option<OralSessionQuiz>
  readonly availableFormats: ReadonlyArray<KnowledgeCheckFormat>
}

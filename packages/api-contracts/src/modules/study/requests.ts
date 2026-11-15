import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const GetDocumentsParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const GetDocumentParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  documentId: ReferenceDocumentId,
})

export const DocumentsQuery = CursorPagination
export const OralMaterialsQuery = CursorPagination
export const SessionResultsQuery = CursorPagination

export const SessionPreviewQuery = Schema.Struct({
  documentId: Schema.optional(ReferenceDocumentId),
  // Without a document, study continues from this one: it, or the next in order, with questions
  // not yet answered; when the whole path was answered, the next one in order.
  fromDocumentId: Schema.optional(ReferenceDocumentId),
})

export const StartSessionPayload = Schema.Struct({
  documentId: ReferenceDocumentId,
  questionCount: QuestionCount,
  // The selection the confirmed preview showed, so going over a covered scope again is deliberate.
  questionSelection: SessionQuestionSelection,
})

export type StartSessionPayload = typeof StartSessionPayload.Type

export const LatestSessionQuery = Schema.Struct({
  // Without a document the latest session of the whole path is returned.
  documentId: Schema.optional(ReferenceDocumentId),
})

export const SessionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: StudySessionId,
})

export const SessionQuestionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: StudySessionId,
  // URL params arrive as strings.
  position: Schema.FiniteFromString.pipe(Schema.decodeTo(SessionQuestionPosition)),
})

export const SubmitSessionAnswerPayload = Schema.Struct({
  // The revision the client showed; the backend refuses an answer to any other one.
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

export type SubmitSessionAnswerPayload = typeof SubmitSessionAnswerPayload.Type

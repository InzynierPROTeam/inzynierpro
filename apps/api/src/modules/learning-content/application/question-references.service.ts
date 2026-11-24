import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { QuestionReference } from '~api/modules/learning-content/domain/question-reference.model.js'

import { QuestionReferenceReader } from './question-reference.reader.js'

export type WithQuestionReferences<A> = {
  readonly question: A
  readonly references: ReadonlyArray<QuestionReference>
}

export const withWrittenQuestionReferences =
  (pathId: QualificationPathId) =>
  <A extends { readonly questionRevisionId: QuestionRevisionId }>(question: A) =>
    QuestionReferenceReader.use(reader =>
      reader.writtenRevisionReferences(pathId, question.questionRevisionId),
    ).pipe(Effect.map((references): WithQuestionReferences<A> => ({ question, references })))

export const withOralQuestionReferences =
  (pathId: QualificationPathId) =>
  <A extends { readonly oralRevisionId: OralRevisionId }>(question: A) =>
    QuestionReferenceReader.use(reader =>
      reader.oralRevisionReferences(pathId, question.oralRevisionId),
    ).pipe(Effect.map((references): WithQuestionReferences<A> => ({ question, references })))

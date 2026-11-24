import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { QuestionReference } from '~api/modules/learning-content/domain/question-reference.model.js'

import type { LearningContentReadError } from './errors.js'

export class QuestionReferenceReader extends Context.Service<
  QuestionReferenceReader,
  {
    readonly writtenRevisionReferences: (
      pathId: QualificationPathId,
      revisionId: QuestionRevisionId,
    ) => Effect.Effect<ReadonlyArray<QuestionReference>, LearningContentReadError>
    readonly oralRevisionReferences: (
      pathId: QualificationPathId,
      revisionId: OralRevisionId,
    ) => Effect.Effect<ReadonlyArray<QuestionReference>, LearningContentReadError>
  }
>()('api/modules/learning-content/QuestionReferenceReader') {}

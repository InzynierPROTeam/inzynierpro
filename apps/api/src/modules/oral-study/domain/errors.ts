import type { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Data } from 'effect'

export class OralRevisionNotInSession extends Data.TaggedError('OralRevisionNotInSession') {}

export class OralQuestionAlreadyAssessed extends Data.TaggedError('OralQuestionAlreadyAssessed') {}

export class OralCategoryNotOnPath extends Data.TaggedError('OralCategoryNotOnPath') {}

export class UnfinishedOralSessionExists extends Data.TaggedError('UnfinishedOralSessionExists')<{
  readonly sessionId: OralStudySessionId
  readonly currentPosition: SessionQuestionPosition
}> {}

export class OralQuizNotOffered extends Data.TaggedError('OralQuizNotOffered') {}

export class OralQuizFormatNotSupported extends Data.TaggedError('OralQuizFormatNotSupported') {}

export class OralQuizCheckMissing extends Data.TaggedError('OralQuizCheckMissing') {}

export class OralQuizSelectionNotAllowed extends Data.TaggedError('OralQuizSelectionNotAllowed') {}

export class OralQuizCheckAlreadyChecked extends Data.TaggedError('OralQuizCheckAlreadyChecked') {}

export class DistrictChamberNotChosen extends Data.TaggedError('DistrictChamberNotChosen') {}

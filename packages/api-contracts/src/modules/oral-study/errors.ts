import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Schema } from 'effect'
import {
  ConflictAnnotations,
  errorFields,
  NotFoundAnnotations,
  UnprocessableEntityAnnotations,
} from '~api-contracts/utils/api-error.js'

export class OralCategoryNotFound extends Schema.TaggedError<
  OralCategoryNotFound,
  { readonly brand: unique symbol }
>()('OralCategoryNotFound', errorFields('oral_category_not_found'), NotFoundAnnotations()) {}

export class DistrictChamberNotChosen extends Schema.TaggedError<
  DistrictChamberNotChosen,
  { readonly brand: unique symbol }
>()(
  'DistrictChamberNotChosen',
  errorFields('district_chamber_not_chosen'),
  ConflictAnnotations(),
) {}

export class OralSessionAlreadyStarted extends Schema.TaggedError<
  OralSessionAlreadyStarted,
  { readonly brand: unique symbol }
>()(
  'OralSessionAlreadyStarted',
  {
    ...errorFields('oral_session_already_started'),
    sessionId: OralStudySessionId,
    currentPosition: SessionQuestionPosition,
  },
  ConflictAnnotations(),
) {}

export class InvalidOralSelfAssessment extends Schema.TaggedError<
  InvalidOralSelfAssessment,
  { readonly brand: unique symbol }
>()(
  'InvalidOralSelfAssessment',
  errorFields('invalid_oral_self_assessment'),
  UnprocessableEntityAnnotations(),
) {}

export class OralSelfAssessmentAlreadySubmitted extends Schema.TaggedError<
  OralSelfAssessmentAlreadySubmitted,
  { readonly brand: unique symbol }
>()(
  'OralSelfAssessmentAlreadySubmitted',
  errorFields('oral_self_assessment_already_submitted'),
  ConflictAnnotations(),
) {}

export class OralQuizUnavailable extends Schema.TaggedError<
  OralQuizUnavailable,
  { readonly brand: unique symbol }
>()('OralQuizUnavailable', errorFields('oral_quiz_unavailable'), ConflictAnnotations()) {}

export class OralQuizFormatUnsupported extends Schema.TaggedError<
  OralQuizFormatUnsupported,
  { readonly brand: unique symbol }
>()(
  'OralQuizFormatUnsupported',
  errorFields('oral_quiz_format_unsupported'),
  UnprocessableEntityAnnotations(),
) {}

export class OralQuizCheckNotFound extends Schema.TaggedError<
  OralQuizCheckNotFound,
  { readonly brand: unique symbol }
>()('OralQuizCheckNotFound', errorFields('oral_quiz_check_not_found'), NotFoundAnnotations()) {}

export class InvalidOralQuizSelection extends Schema.TaggedError<
  InvalidOralQuizSelection,
  { readonly brand: unique symbol }
>()(
  'InvalidOralQuizSelection',
  errorFields('invalid_oral_quiz_selection'),
  UnprocessableEntityAnnotations(),
) {}

export class OralQuizCheckAlreadyAnswered extends Schema.TaggedError<
  OralQuizCheckAlreadyAnswered,
  { readonly brand: unique symbol }
>()(
  'OralQuizCheckAlreadyAnswered',
  errorFields('oral_quiz_check_already_answered'),
  ConflictAnnotations(),
) {}

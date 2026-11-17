import {
  DistrictChamberNotChosen,
  InvalidOralQuizSelection,
  OralQuizCheckAlreadyAnswered,
  OralQuizCheckNotFound,
  OralQuizFormatUnsupported,
  OralQuizUnavailable,
  InvalidOralSelfAssessment,
  OralCategoryNotFound,
  OralSelfAssessmentAlreadySubmitted,
  OralSessionAlreadyStarted,
} from '@inzpro/api-contracts/modules/oral-study/errors'
import { Effect } from 'effect'
import type { UnfinishedOralSessionExists } from '~api/modules/oral-study/domain/errors.js'

export const oralCategoryNotFound = Effect.fail(
  new OralCategoryNotFound({
    type: 'oral_category_not_found',
    message: 'The oral category was not found on this path.',
  }),
)

export const districtChamberNotChosen = Effect.fail(
  new DistrictChamberNotChosen({
    type: 'district_chamber_not_chosen',
    message: 'Choose a district chamber on this path to study questions reported in your chamber.',
  }),
)

export const oralSessionAlreadyStarted = (error: UnfinishedOralSessionExists) =>
  Effect.fail(
    new OralSessionAlreadyStarted({
      type: 'oral_session_already_started',
      message: 'This oral category already has an unfinished session. Continue it instead.',
      sessionId: error.sessionId,
      currentPosition: error.currentPosition,
    }),
  )

export const invalidOralSelfAssessment = Effect.fail(
  new InvalidOralSelfAssessment({
    type: 'invalid_oral_self_assessment',
    message: 'The self-assessment does not refer to the revision this session shows.',
  }),
)

export const oralSelfAssessmentAlreadySubmitted = Effect.fail(
  new OralSelfAssessmentAlreadySubmitted({
    type: 'oral_self_assessment_already_submitted',
    message: 'This question already has a self-assessment in this session.',
  }),
)

export const oralQuizUnavailable = Effect.fail(
  new OralQuizUnavailable({
    type: 'oral_quiz_unavailable',
    message: 'This oral session has no knowledge checks to offer in the supported formats.',
  }),
)

export const oralQuizFormatUnsupported = Effect.fail(
  new OralQuizFormatUnsupported({
    type: 'oral_quiz_format_unsupported',
    message: 'This quiz contains a check format the client does not support. Update the app.',
  }),
)

export const oralQuizCheckNotFound = Effect.fail(
  new OralQuizCheckNotFound({
    type: 'oral_quiz_check_not_found',
    message: 'The quiz check was not found.',
  }),
)

export const invalidOralQuizSelection = Effect.fail(
  new InvalidOralQuizSelection({
    type: 'invalid_oral_quiz_selection',
    message: 'The selected options do not fit this quiz check.',
  }),
)

export const oralQuizCheckAlreadyAnswered = Effect.fail(
  new OralQuizCheckAlreadyAnswered({
    type: 'oral_quiz_check_already_answered',
    message: 'This quiz check already has a final answer.',
  }),
)

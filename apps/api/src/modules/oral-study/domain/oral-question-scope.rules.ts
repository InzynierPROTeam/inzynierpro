import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import {
  type OralQuestionScope,
  pathOralQuestionScope,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Effect, Option } from 'effect'
import { DistrictChamberNotChosen } from '~api/modules/oral-study/domain/errors.js'

export type OralQuestionFilter = {
  readonly questionScope: OralQuestionScope
  readonly reportedIn: Option.Option<DistrictChamberId>
}

export const wholePathFilter: OralQuestionFilter = {
  questionScope: pathOralQuestionScope,
  reportedIn: Option.none(),
}

export const oralQuestionFilter = (
  questionScope: OralQuestionScope,
  districtChamber: Option.Option<{ readonly id: DistrictChamberId }>,
): Effect.Effect<OralQuestionFilter, DistrictChamberNotChosen> =>
  questionScope === pathOralQuestionScope
    ? Effect.succeed(wholePathFilter)
    : Option.match(districtChamber, {
        onNone: () => Effect.fail(new DistrictChamberNotChosen()),
        onSome: ({ id }) => Effect.succeed({ questionScope, reportedIn: Option.some(id) }),
      })

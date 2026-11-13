import { UserId } from '@inzpro/domain/modules/identity/user'
import {
  type ExamAccessScope,
  type ExamPart,
  bothExamAccess,
  oralExamAccess,
  writtenExamAccess,
} from '@inzpro/domain/modules/preparation/exam-access'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Exit, Layer, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { PathPermissionDenied } from '~api/modules/preparation/domain/errors.js'
import { UserQualificationPath } from '~api/modules/preparation/domain/preparation.model.js'

import { requireAssignment } from './assignment.policy.js'
import { requirePathAccess } from './path-access.policy.js'
import { PreparationReader } from './preparation.reader.js'

const userId = Schema.decodeSync(UserId)('01997d80-0000-7000-8000-0000000000a1')
const pathId = Schema.decodeSync(QualificationPathId)('10000000-0000-4000-8000-000000000001')

const assignment = (accessScope: ExamAccessScope, archived: boolean) =>
  Schema.decodeSync(UserQualificationPath)({
    id: pathId,
    name: 'Konstrukcyjno-budowlana — kierowanie robotami bez ograniczeń',
    specialization: {
      id: '60000000-0000-4000-8000-000000000001',
      code: 'konstrukcyjno-budowlana',
      name: 'Konstrukcyjno-budowlana',
      description: null,
    },
    qualificationKind: {
      id: '70000000-0000-4000-8000-000000000001',
      code: 'kierowanie',
      name: 'Kierowania robotami',
    },
    qualificationScope: {
      id: '80000000-0000-4000-8000-000000000001',
      code: 'bez-ograniczen',
      name: 'Bez ograniczeń',
    },
    accessScope,
    archived,
    goal: {
      version: 1,
      examSessionId: '90000000-0000-4000-8000-000000000001',
      sessionName: 'Sesja Wiosenna',
      sessionIsConfirmed: true,
      writtenAt: '2027-05-21T08:00:00.000Z',
      oralPlanningAt: '2027-06-04T08:00:00.000Z',
      oralExamDate: null,
      accessScope,
    },
  })

// A reader holding at most one assignment of the user; other lookups are outside these policies.
const readerWith = (found: Option.Option<UserQualificationPath>) =>
  Layer.succeed(PreparationReader)({
    hasReachedPathLimit: () => Effect.die('unused by the policies'),
    paths: () => Effect.die('unused by the policies'),
    goals: () => Effect.die('unused by the policies'),
    path: (requestedUser, requestedPath) =>
      Effect.succeed(requestedUser === userId && requestedPath === pathId ? found : Option.none()),
  })

const denied = Exit.fail(new PathPermissionDenied())

const accessExit = (found: Option.Option<UserQualificationPath>, part?: ExamPart) =>
  Effect.runSync(
    Effect.exit(requirePathAccess(userId, pathId, part).pipe(Effect.provide(readerWith(found)))),
  )

describe('path access policy', () => {
  it.each([
    [bothExamAccess, writtenExamAccess, true],
    [bothExamAccess, oralExamAccess, true],
    [writtenExamAccess, writtenExamAccess, true],
    [writtenExamAccess, oralExamAccess, false],
    [oralExamAccess, oralExamAccess, true],
    [oralExamAccess, writtenExamAccess, false],
  ] as const)('a %s path opens %s material: %s', (accessScope, part, allowed) => {
    const active = assignment(accessScope, false)

    expect(accessExit(Option.some(active), part)).toEqual(allowed ? Exit.succeed(active) : denied)
  })

  it.each([writtenExamAccess, oralExamAccess] as const)(
    'any active path opens path-level material regardless of its %s scope',
    accessScope => {
      const active = assignment(accessScope, false)

      expect(accessExit(Option.some(active))).toEqual(Exit.succeed(active))
    },
  )

  it('an archived path opens no material', () => {
    const archived = Option.some(assignment(bothExamAccess, true))

    expect(accessExit(archived)).toEqual(denied)
    expect(accessExit(archived, writtenExamAccess)).toEqual(denied)
  })

  it('a path the user was never assigned is denied', () =>
    expect(accessExit(Option.none(), writtenExamAccess)).toEqual(denied))
})

describe('assignment policy', () => {
  const assignmentExit = (found: Option.Option<UserQualificationPath>) =>
    Effect.runSync(
      Effect.exit(requireAssignment(userId, pathId).pipe(Effect.provide(readerWith(found)))),
    )

  it('returns an archived assignment, so it can still be restored', () => {
    const archived = assignment(writtenExamAccess, true)

    expect(assignmentExit(Option.some(archived))).toEqual(Exit.succeed(archived))
  })

  it('denies a path the user was never assigned', () =>
    expect(assignmentExit(Option.none())).toEqual(denied))
})

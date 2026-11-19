import { BadgeCode } from '@inzpro/domain/modules/learning-xp/badge'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { StreakLength } from '@inzpro/domain/modules/streak/streak'
import { Schema } from 'effect'
import { ExamSessionOption } from '~api-contracts/modules/exam-calendar/responses.js'
import {
  QualificationKind,
  QualificationScope,
  Specialization,
} from '~api-contracts/modules/qualification-paths/responses.js'

export const ProfileSettings = Schema.Struct({
  name: Schema.String,
  privateProfile: Schema.Boolean,
})

export type ProfileSettings = typeof ProfileSettings.Type

export const PublicProfileBadge = Schema.Struct({ code: BadgeCode })

export type PublicProfileBadge = typeof PublicProfileBadge.Type

export const PublicProfilePath = Schema.Struct({
  specialization: Schema.Struct({
    id: Specialization.fields.id,
    name: Specialization.fields.name,
  }),
  qualificationKind: Schema.Struct({
    id: QualificationKind.fields.id,
    name: QualificationKind.fields.name,
  }),
  qualificationScope: Schema.Struct({
    id: QualificationScope.fields.id,
    name: QualificationScope.fields.name,
  }),
  examSession: Schema.Struct({
    id: ExamSessionOption.fields.id,
    name: ExamSessionOption.fields.name,
    writtenAt: ExamSessionOption.fields.writtenAt,
  }),
})

export type PublicProfilePath = typeof PublicProfilePath.Type

export const PublicProfile = Schema.Struct({
  name: Schema.String,
  image: Schema.NullOr(Schema.String),
  totalXp: LearningXp,
  badges: Schema.Array(PublicProfileBadge),
  currentStreak: StreakLength,
  paths: Schema.Array(PublicProfilePath),
})

export type PublicProfile = typeof PublicProfile.Type

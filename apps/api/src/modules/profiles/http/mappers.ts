import type {
  ProfileSettings as ProfileSettingsDto,
  PublicProfile as PublicProfileDto,
  PublicProfilePath,
} from '@inzpro/api-contracts/modules/profiles/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Option } from 'effect'
import type { UserQualificationPath } from '~api/modules/preparation/domain/preparation.model.js'

import type { PublicProfile, UserProfile } from '../domain/profile.model.js'

export const toProfileSettingsDto = (profile: UserProfile): ProfileSettingsDto => ({
  name: profile.name,
  privateProfile: profile.privateProfile,
})

const toPublicProfilePathDto = (path: UserQualificationPath): PublicProfilePath => ({
  specialization: { id: path.specialization.id, name: path.specialization.name },
  qualificationKind: { id: path.qualificationKind.id, name: path.qualificationKind.name },
  qualificationScope: { id: path.qualificationScope.id, name: path.qualificationScope.name },
  examSession: {
    id: path.goal.examSessionId,
    name: path.goal.sessionName,
    writtenAt: dateTimeUtcToUtcIsoDateTime(path.goal.writtenAt),
  },
})

export const toPublicProfileDto = (profile: PublicProfile): PublicProfileDto => ({
  name: profile.profile.name,
  image: Option.getOrNull(profile.profile.image),
  totalXp: profile.totalXp,
  badges: profile.badges.map(badge => ({ code: badge.code })),
  currentStreak: profile.currentStreak,
  paths: profile.paths.map(toPublicProfilePathDto),
})

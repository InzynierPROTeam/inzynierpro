import { UserId } from '@inzpro/domain/modules/identity/user'
import { Schema } from 'effect'

export const RenameProfilePayload = Schema.Struct({ name: Schema.String })

export type RenameProfilePayload = typeof RenameProfilePayload.Type

export const SetProfilePrivacyPayload = Schema.Struct({ privateProfile: Schema.Boolean })

export type SetProfilePrivacyPayload = typeof SetProfilePrivacyPayload.Type

export const PublicProfileParams = Schema.Struct({ userId: UserId })

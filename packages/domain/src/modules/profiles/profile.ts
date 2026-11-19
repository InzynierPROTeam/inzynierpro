import { Schema } from 'effect'

export const profileNameMaxLength = 40

export const ProfileName = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(profileNameMaxLength),
).pipe(Schema.brand('ProfileName'))

export type ProfileName = typeof ProfileName.Type

const endsWithHighSurrogate = (text: string) => /[\uD800-\uDBFF]$/.test(text)

export const normalizeProfileName = (name: string) => {
  const truncated = name.trim().slice(0, profileNameMaxLength)

  return (endsWithHighSurrogate(truncated) ? truncated.slice(0, -1) : truncated).trimEnd()
}

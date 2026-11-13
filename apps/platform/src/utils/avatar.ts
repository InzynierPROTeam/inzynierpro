import type { UserId } from '@inzpro/domain/modules/identity/user'

export const avatarColors = [
  '#9F1239',
  '#7C3AED',
  '#9333EA',
  '#C026D3',
  '#DB2777',
  '#DC2626',
  '#C2410C',
  '#A16207',
  '#15803D',
  '#0F766E',
  '#0E7490',
  '#475569',
] as const

export const getAvatarColor = (userId: UserId) => {
  let hash = 0

  for (const character of userId) {
    hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0
  }

  return avatarColors[(hash >>> 0) % avatarColors.length] ?? avatarColors[0]
}

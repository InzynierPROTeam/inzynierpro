export const TWITTER_HANDLE = 'InzynierPro'

export const SocialsLinks = {
  Instagram: 'https://www.instagram.com/inzynier.pro',
  TikTok: 'https://www.tiktok.com/@inzynier.pro',
  X: `https://x.com/${TWITTER_HANDLE}`,
  YouTube: 'https://www.youtube.com/@InzynierPRO',
  Facebook: 'https://www.facebook.com/inzynier.pro',
} as const

export type SocialsLinks = typeof SocialsLinks

export type SocialsLink = keyof SocialsLinks

export type SocialsLinkUrl = SocialsLinks[SocialsLink]

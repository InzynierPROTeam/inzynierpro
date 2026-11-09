export const mobileAppSlug = 'inzynierpro' as const
export const mobileAppScheme = 'inzynierpro' as const
export const mobileAppBundleIdentifier = 'pro.inzynier.app' as const

export const mobileAppStoreId = 6806799541
export const mobileAppStoreUrl = `https://apps.apple.com/app/id${mobileAppStoreId}`

export const mobileGooglePlayUrl = `https://play.google.com/store/apps/details?id=${mobileAppBundleIdentifier}`

export const MobileStoreLinks = {
  appStore: mobileAppStoreUrl,
  googlePlay: mobileGooglePlayUrl,
} as const

export type MobileStoreLinks = typeof MobileStoreLinks

export type MobileStoreLink = keyof MobileStoreLinks

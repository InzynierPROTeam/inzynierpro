import { appName as _appName, type EmailAddress } from '@inzpro/config/app'
import { POLISH_LOCALE } from '@inzpro/config/localization'
import { type SocialsLinkUrl } from '@inzpro/config/social'
import { seoFactory } from '@inzpro/utils/seo'
import type { StringWithAutoCompleteOptions } from '@inzpro/utils/types'
import { getAppUrl, getMainPageUrl } from '~platform/utils/url'

export const appName = _appName

export const description =
  'Zdaj egzamin na uprawnienia budowlane za pierwszym razem. Tysiące pytań PIIB i IARP, symulator egzaminu pisemnego i darmowe akty prawne. Zacznij za darmo.'

export const OG_IMAGE_URL = getAppUrl('/images/shared/og.png')
export const LOGO_URL = getAppUrl('/images/shared/logo.webp')

export const seo = seoFactory({
  locale: POLISH_LOCALE,
  siteName: appName,
  titleSuffix: `Platforma ${appName} Uprawnienia Budowlane`,
  description,
  image: OG_IMAGE_URL,
})

export const ExternalLinks = {
  homepage: getMainPageUrl(),
  contact: getMainPageUrl('/kontakt'),
  blog: getMainPageUrl('/blog'),
  faq: getMainPageUrl('/faq'),
  knowledge: getMainPageUrl('/baza-wiedzy'),
  mobileApp: getMainPageUrl('/aplikacja'),

  privacyPolicy: getMainPageUrl('/dokumenty/polityka-prywatnosci'),
  termsAndConditionsPolicy: getMainPageUrl('/dokumenty/regulamin'),
  launchPromotionRulebook: getMainPageUrl('/dokumenty/regulamin-promocji-premierowej'),
  referralProgrammeRulebook: getMainPageUrl('/dokumenty/regulamin-programu-polecen'),
  cookiesPolicy: getMainPageUrl('/dokumenty/polityka-cookies'),
} as const

export type ExternalLinks = typeof ExternalLinks

export type ExternalLink = keyof ExternalLinks

export type ExternalLinkUrl = StringWithAutoCompleteOptions<SocialsLinkUrl | EmailAddress>

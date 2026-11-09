import { DOMAIN } from '@inzpro/config/app'

const MAIN_PAGE_URL = `https://${DOMAIN}`
const CDN_URL = `https://cdn.${DOMAIN}`

export const links = {
  mainPage: MAIN_PAGE_URL,
  contactPage: `${MAIN_PAGE_URL}/kontakt`,
  logo: `${CDN_URL}/inzynier-pro-logo.png`,
  facebookIcon: `${CDN_URL}/fb.png`,
  instagramIcon: `${CDN_URL}/ig.png`,
  tiktokIcon: `${CDN_URL}/tiktok.png`,
}

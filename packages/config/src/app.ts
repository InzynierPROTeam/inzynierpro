export const appName = 'InżynierPRO'
export const appNameKebabCase = 'inzynier-pro'

export const DOMAIN = 'inzynier.pro'

export type Domain = typeof DOMAIN

export type EmailName =
  | 'kontakt'
  | 'pomoc'
  | 'hello'
  | 'info'
  | 'biuro'
  | 'admin'
  | 'security'
  | 'dev'
  | 'no-reply'

export type EmailAddress = `${EmailName}@${Domain}`

export const getEmailAddress = (name: EmailName): EmailAddress => `${name}@${DOMAIN}`

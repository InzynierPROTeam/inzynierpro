import { appName, getEmailAddress, type EmailName } from '@inzpro/config/app'

// A sender such as `InżynierPRO <info@inzynier.pro>`.
export const getSender = (name: EmailName, label = appName) => `${label} <${getEmailAddress(name)}>`

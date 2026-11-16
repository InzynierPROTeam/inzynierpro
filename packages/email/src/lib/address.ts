import { appName, getEmailAddress, type EmailName } from '@inzpro/config/app'

export const getSender = (name: EmailName, label = appName) => `${label} <${getEmailAddress(name)}>`

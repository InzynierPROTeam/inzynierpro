import { env } from '~platform/lib/env'

export const getMainPageUrl = (path: string = '') => new URL(path, env.VITE_MAIN_PAGE_BASE_URL).href

export const getAppUrl = (path: string) => new URL(path, env.VITE_APP_BASE_URL).href

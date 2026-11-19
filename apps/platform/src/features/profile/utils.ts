import { getRouteApi } from '@tanstack/react-router'

export const profileRouteApi = getRouteApi('/(app)/_authenticated/profil')

export const publicProfileRouteApi = getRouteApi('/(app)/_authenticated/uzytkownik/$userId')

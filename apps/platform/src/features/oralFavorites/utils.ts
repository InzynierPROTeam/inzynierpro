import { getRouteApi } from '@tanstack/react-router'

export const oralFavoritesPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/ulubione',
)

export const noOralFavoritesMessage =
  'Nie masz jeszcze ulubionych pytań ustnych. Oznacz pytanie gwiazdką podczas nauki, aby do niego wrócić.'

import { getRouteApi } from '@tanstack/react-router'

export const favoritesPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/ulubione',
)

export const noFavoritesMessage =
  'Nie masz jeszcze ulubionych pytań. Oznacz pytanie gwiazdką podczas nauki, aby do niego wrócić.'

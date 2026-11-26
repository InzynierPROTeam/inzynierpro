import { getRouteApi } from '@tanstack/react-router'

export const chambersRouteApi = getRouteApi('/(app)/_authenticated/_onboarded/moja-izba')

export const getGoogleMapsSearchUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

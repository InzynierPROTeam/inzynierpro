import { getRouteApi } from '@tanstack/react-router'

export const publicOnboardingRouteApi = getRouteApi('/(public)/_layout/zacznij')

export const onboardingRouteApi = getRouteApi('/(app)/_authenticated/pierwsze-kroki')

export const onboardedRouteApi = getRouteApi('/(app)/_authenticated/_onboarded')

import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '~platform/layout/public/PublicLayout'

export const Route = createFileRoute('/_maybeauthenticated/(public)/_layout')({
  component: PublicLayout,
})

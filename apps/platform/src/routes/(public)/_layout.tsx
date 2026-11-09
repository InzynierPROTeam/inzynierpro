import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '~platform/layout/public/PublicLayout'

export const Route = createFileRoute('/(public)/_layout')({
  component: PublicLayout,
})

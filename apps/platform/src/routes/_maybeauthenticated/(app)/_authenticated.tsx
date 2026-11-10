import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '~platform/layout/app/AppLayout'

export const Route = createFileRoute('/_maybeauthenticated/(app)/_authenticated')({
  beforeLoad: ({ location, context: { user, queryClient } }) => {
    if (user === undefined) {
      queryClient.clear()

      throw redirect({ to: '/logowanie', search: { redirect: location.href }, replace: true })
    }

    return { user }
  },
  component: AppLayout,
})

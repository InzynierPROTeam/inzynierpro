import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_maybeauthenticated/(public)/_layout/_notauthenticated')({
  beforeLoad: ({ context: { user } }) => {
    if (user !== undefined) {
      throw redirect({ to: '/start', replace: true })
    }
  },
})

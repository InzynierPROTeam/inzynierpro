import { createFileRoute } from '@tanstack/react-router'

function requireUnauthenticated() {
  // TODO(auth): Load the session through shared queries and redirect signed-in users
  // to the learning screen. Until authentication is implemented, this guard does nothing.
}

export const Route = createFileRoute('/(public)/_layout/_notauthenticated')({
  beforeLoad: requireUnauthenticated,
})

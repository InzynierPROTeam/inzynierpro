import { buttonVariants } from '@inzpro/ui/button'
import { Link } from '@tanstack/react-router'

// TODO(auth): Point this link to the sign-in route when authentication is implemented.
export const SignInButton = () => (
  <Link
    to="/"
    className={buttonVariants({ className: 'rounded-full!' })}
  >
    Zaloguj się
  </Link>
)

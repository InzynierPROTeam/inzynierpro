import { buttonVariants } from '@inzpro/ui/button'
import { Link } from '@tanstack/react-router'

// TODO(auth): Point this link to the sign-in route when authentication is implemented.
export const SignInButtons = () => (
  <div className="flex items-center gap-4">
    <Link
      to="/"
      className={buttonVariants({ className: 'rounded-full!' })}
    >
      Zaloguj się
    </Link>
  </div>
)

import { buttonVariants } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'

export const SignInButton = () => (
  <Link
    to="/logowanie"
    className={buttonVariants({ className: 'rounded-full!' })}
  >
    Zaloguj się
  </Link>
)

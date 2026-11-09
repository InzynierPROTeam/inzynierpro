import { buttonVariants } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'

export const SignInButtons = () => (
  <div className="flex items-center gap-4">
    <Link
      to="/login"
      className={buttonVariants({ className: 'rounded-full!' })}
    >
      Zaloguj się
    </Link>
  </div>
)

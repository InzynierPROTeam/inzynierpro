import { Link } from '@tanstack/react-router'
import { BookOpen, Brain, Home, Mic2, Smartphone, User2 } from 'lucide-react'
import { cx } from 'tailwind-variants'
import { ExternalLink } from '~platform/components/ExternalLink'
import { ExternalLinks } from '~platform/config/app'

const mobileLinkClassName =
  'group relative flex items-center gap-1 text-current/80 transition-colors duration-150 hover:text-current before:pointer-events-none before:absolute before:-bottom-1 before:left-0 before:h-px before:w-full before:origin-right before:scale-x-0 before:bg-current before:transition-transform before:duration-300 hover:before:origin-left hover:before:scale-x-100 data-[status=active]:text-primary-foreground data-[status=active]:before:scale-x-100'

const links = [
  { to: '/start', label: 'Start', icon: Home },
  { to: '/nauka', label: 'Nauka', icon: Brain },
  { to: '/ustny', label: 'Egzamin ustny', icon: Mic2 },
  { to: '/profil', label: 'Konto', icon: User2 },
] as const

type NavLinksProps = {
  onNavigate?: () => void
  mobile?: boolean
}

export const NavLinks = ({ onNavigate, mobile = false }: NavLinksProps) => (
  <ul className={cx('flex flex-col', mobile ? 'gap-4' : 'divide-border divide-y')}>
    {links.map(({ to, label, icon: Icon }) => (
      <li
        key={to}
        className={cx(!mobile && 'py-4 first:pt-0')}
      >
        <Link
          to={to}
          onClick={onNavigate}
          className={cx(
            mobile
              ? mobileLinkClassName
              : 'text-foreground/70 hover:bg-muted/70 data-[status=active]:bg-muted data-[status=active]:text-foreground -mx-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
          )}
        >
          <Icon className={cx(mobile ? 'size-4' : 'size-5')} />
          {label}
        </Link>
      </li>
    ))}
    <li className={cx(!mobile && 'pt-4')}>
      <ExternalLink
        href={ExternalLinks.knowledge}
        onClick={onNavigate}
        className={cx(
          mobile
            ? mobileLinkClassName
            : 'text-foreground/70 hover:bg-muted/70 -mx-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
        )}
      >
        <BookOpen className={cx(mobile ? 'size-4' : 'size-5')} />
        Baza wiedzy
      </ExternalLink>
    </li>
    <li className={cx(!mobile && 'pt-4')}>
      <ExternalLink
        href={ExternalLinks.mobileApp}
        onClick={onNavigate}
        className={cx(
          mobile
            ? mobileLinkClassName
            : 'text-foreground/70 hover:bg-muted/70 -mx-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
        )}
      >
        <Smartphone className={cx(mobile ? 'size-4' : 'size-5')} />
        Aplikacja mobilna
      </ExternalLink>
    </li>
  </ul>
)

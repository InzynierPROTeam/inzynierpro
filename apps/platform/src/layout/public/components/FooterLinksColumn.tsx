import { Link, type RegisteredRouter, type ValidateLinkOptions } from '@tanstack/react-router'
import { ExternalLink } from '~platform/components/ExternalLink'
import type { ExternalLinkUrl } from '~platform/config/app'

type InternalLink<TRouter extends RegisteredRouter = RegisteredRouter, TOptions = unknown> = {
  label: string
} & Pick<ValidateLinkOptions<TRouter, TOptions>, 'to' | 'params'>

type ExternalLinkProps = {
  href: ExternalLinkUrl
  label: string
}

export type FooterLink = InternalLink | ExternalLinkProps

type FooterLinksColumnProps = {
  title: React.ReactNode
  links: Array<FooterLink>
}

export const FooterLinksColumn: React.FC<FooterLinksColumnProps> = ({ title, links }) => (
  <div className="flex flex-col gap-4">
    <p className="text-sm font-medium">{title}</p>

    <ul className="[&>li]:text-muted-foreground [&>li]:hover:text-primary/70 flex flex-col items-start gap-1 text-sm [&>li]:transition-colors">
      {links.map(link => {
        if ('href' in link) {
          return (
            <li key={link.label}>
              <ExternalLink href={link.href}>{link.label}</ExternalLink>
            </li>
          )
        }

        return (
          <li key={link.label}>
            <Link {...link}>{link.label}</Link>
          </li>
        )
      })}
    </ul>
  </div>
)

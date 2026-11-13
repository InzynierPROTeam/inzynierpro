import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { cn } from 'tailwind-variants'

import { ExternalLink, type ExternalLinkProps } from './ExternalLink'

type SocialIconProps = {
  label: string
  href: ExternalLinkProps['href']
  icon: React.ReactNode
  className?: string
}

export const SocialIcon: React.FC<SocialIconProps> = ({ href, icon, label, className }) => (
  <ExternalLink
    href={href}
    aria-label={label}
  >
    <IconWrapper
      className={cn('text-primary bg-current/20 transition-colors hover:bg-current/30', className)}
    >
      {icon}
    </IconWrapper>
  </ExternalLink>
)

import type { ExternalLinkUrl } from '~platform/config/app'

type LinkProps = React.ComponentProps<'a'>

export type ExternalLinkProps = {
  href: ExternalLinkUrl
  openInNewTab?: boolean
} & Omit<LinkProps, 'target' | 'rel' | 'href'>

export const ExternalLink: React.FC<ExternalLinkProps> = ({ openInNewTab = true, ...props }) => (
  <a
    {...(openInNewTab ? { target: '_blank', rel: 'noreferrer' } : {})}
    {...props}
  />
)

import { ExternalLink } from '~platform/components/ExternalLink'
import { ExternalLinks } from '~platform/config/app'

type NavLinksProps = {
  onNavLinkClick?: VoidFunction
}

export const NavLinks: React.FC<NavLinksProps> = ({ onNavLinkClick }) => (
  <ul className="flex gap-4 max-lg:flex-col max-lg:items-center max-lg:gap-6">
    <li>
      <ExternalLink
        href={ExternalLinks.knowledge}
        onClick={onNavLinkClick}
        className="font-medium text-current/80 transition-colors duration-150 hover:text-current max-md:text-base"
      >
        Baza Wiedzy
      </ExternalLink>
    </li>
    <li>
      <ExternalLink
        href={ExternalLinks.contact}
        onClick={onNavLinkClick}
        className="font-medium text-current/80 transition-colors duration-150 hover:text-current max-md:text-base"
      >
        Kontakt
      </ExternalLink>
    </li>
    <li>
      <ExternalLink
        href={ExternalLinks.faq}
        onClick={onNavLinkClick}
        className="font-medium text-current/80 transition-colors duration-150 hover:text-current max-md:text-base"
      >
        FAQ
      </ExternalLink>
    </li>
  </ul>
)

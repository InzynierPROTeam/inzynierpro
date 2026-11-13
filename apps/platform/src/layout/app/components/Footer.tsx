import { getCurrentFullYear } from '@inzpro/utils/date'
import { Fragment } from 'react'
import { ExternalLink } from '~platform/components/ExternalLink'
import { appName, ExternalLinks } from '~platform/config/app'

const links = [
  { href: ExternalLinks.knowledge, label: 'Baza wiedzy' },
  { href: ExternalLinks.faq, label: 'FAQ' },
  { href: ExternalLinks.contact, label: 'Kontakt' },
  { href: ExternalLinks.privacyPolicy, label: 'Polityka prywatności' },
  { href: ExternalLinks.termsAndConditionsPolicy, label: 'Regulamin' },
  { href: ExternalLinks.cookiesPolicy, label: 'Polityka cookies' },
]

export const Footer = () => (
  <footer className="layout-container">
    <div className="layout-section text-foreground/50 gap-6 py-6!">
      <nav
        aria-label="Linki stopki"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm lg:ml-78"
      >
        {links.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 && <span aria-hidden="true">•</span>}
            <ExternalLink
              href={link.href}
              className="hover:text-foreground/70 transition-colors"
            >
              {link.label}
            </ExternalLink>
          </Fragment>
        ))}
      </nav>
      <small className="text-xs lg:ml-78">
        © {getCurrentFullYear()} {appName}. Wszystkie prawa zastrzeżone.
      </small>
    </div>
  </footer>
)

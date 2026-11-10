import { appName } from '@inzpro/config/app'
import { Img, Section } from 'react-email'
import { links } from '~email/lib/links.js'

export const Header = () => (
  <Section className="px-10 pt-10 pb-5 text-center">
    <Img
      src={links.logo}
      alt={appName}
      className="mx-auto h-auto w-full max-w-15"
    />
  </Section>
)

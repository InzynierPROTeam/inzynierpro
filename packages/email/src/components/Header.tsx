import { appName } from '@inzpro/config/app'
import { Img, Section } from 'react-email'
import { links } from '~email/lib/links.js'

export const Header = () => (
  <Section className="px-[40px] pt-[40px] pb-[20px] text-center">
    <Img
      src={links.logo}
      alt={appName}
      className="mx-auto h-auto w-full max-w-[60px]"
    />
  </Section>
)

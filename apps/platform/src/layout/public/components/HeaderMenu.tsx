import { ThemeSwitchButton } from '@inzpro/ui/theme-switch'

import { MobileMenu } from './MobileMenu'
import { NavLinks } from './NavLinks'
import { SignInButton } from './SignInButton'

export const HeaderMenu = () => (
  <div className="flex flex-1 items-center justify-end gap-6">
    <div className="flex flex-1 items-center justify-end gap-6 max-lg:hidden">
      <NavLinks />
    </div>
    <ThemeSwitchButton />
    <SignInButton />
    <MobileMenu />
  </div>
)

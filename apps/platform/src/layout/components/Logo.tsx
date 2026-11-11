import type React from 'react'
import { Icon } from '~platform/components/Icon'
import { appName } from '~platform/config/app'

type LogoProps = {
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ className }) => (
  <Icon
    name="Logo"
    className={`shrink-0 ${className}`}
    aria-label={`${appName} logo`}
  />
)

export const LogoVertical = () => (
  <div className="-mb-2 flex flex-col items-center gap-1">
    <Logo className="size-8" />
    <span className="gradient-text-brand text-xs leading-none font-bold">Platforma</span>
  </div>
)

export const LogoHorizontal = () => (
  <div className="flex items-center gap-2">
    <Logo className="size-8" />
    <div className="flex flex-col items-center max-sm:hidden">
      <span className="gradient-text-brand self-start text-sm leading-none font-bold">
        Platforma
      </span>
    </div>
  </div>
)

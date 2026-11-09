import type { Theme } from '@inzpro/react-utils/theme'
import { Moon, Sun, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { useTheme } from '~ui/providers/theme-provider.js'

import { Button } from './button.js'

type ThemeOption = {
  icon: LucideIcon
}

const THEME_CONFIG = {
  light: {
    icon: Sun,
  },
  dark: {
    icon: Moon,
  },
  system: {
    icon: Sun,
  },
} satisfies Record<Theme, ThemeOption>

const LightThemeIcon = THEME_CONFIG.light.icon
const DarkThemeIcon = THEME_CONFIG.dark.icon
const SystemLightThemeIcon = THEME_CONFIG.light.icon
const SystemDarkThemeIcon = THEME_CONFIG.dark.icon

const THEME_SEQUENCE: Array<Theme> = ['light', 'dark', 'system']

type WithThemeSwitchProps = {
  children: (onToggle: VoidFunction) => React.ReactNode
}

export const WithThemeSwitch: React.FC<WithThemeSwitchProps> = ({ children }) => {
  const { theme, setTheme } = useTheme()

  const handleToggle = () => {
    const currentIndex = THEME_SEQUENCE.indexOf(theme)
    const nextIndex = (currentIndex + 1) % THEME_SEQUENCE.length
    const nextTheme = THEME_SEQUENCE[nextIndex]

    if (nextTheme) {
      setTheme(nextTheme)
    }
  }

  return children(handleToggle)
}

type ThemeButtonProps = {
  onToggle: VoidFunction
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({ onToggle, ...props }) => (
  <Button
    {...props}
    variant="ghost"
    size="icon-md"
    onClick={onToggle}
    aria-label="Przełącz motyw"
    className="relative"
  >
    <LightThemeIcon className="system:hidden size-4 dark:hidden" />
    <DarkThemeIcon className="not-system:dark:inline hidden size-4" />
    <SystemLightThemeIcon className="system:light:inline hidden size-4" />
    <SystemDarkThemeIcon className="system:dark:inline hidden size-4" />
    <span className="system:flex bg-foreground/10 text-foreground/50 absolute top-0 right-0 hidden size-2.5 items-center justify-center rounded-full text-[0.4rem] leading-none">
      A
    </span>
  </Button>
)

export const ThemeSwitchButton = () => (
  <WithThemeSwitch>{onToggle => <ThemeButton onToggle={onToggle} />}</WithThemeSwitch>
)

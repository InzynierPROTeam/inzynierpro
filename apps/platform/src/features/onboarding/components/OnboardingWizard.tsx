import type React from 'react'

type OnboardingWizardProps = { children: React.ReactNode }

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ children }) => (
  <div className="flex w-full max-w-2xl flex-col gap-12 self-center">
    <h1 className="sr-only">Wybierz ścieżkę nauki</h1>
    {children}
  </div>
)

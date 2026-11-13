import type React from 'react'

type StepFooterProps = { children: React.ReactNode }

export const StepFooter: React.FC<StepFooterProps> = ({ children }) => (
  <div className="max-md:bg-background/80 z-20 flex justify-center max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-2xl max-md:p-6 max-md:backdrop-blur-xl">
    {children}
  </div>
)

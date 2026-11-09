import { useMobileMenu } from '@inzpro/ui/hooks/use-mobile-menu'
import { ClientOnly } from '@tanstack/react-router'
import { cx } from 'class-variance-authority'
import { createPortal } from 'react-dom'
import { Hamburger } from '~platform/layout/components/Hamburger'

import { NavLinks } from './NavLinks'

function MobileMenuPortal({ children }: React.PropsWithChildren) {
  return createPortal(children, document.body)
}

export const MobileMenu = () => {
  const {
    isOpen,
    setIsOpen,
    touchStart,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    style,
  } = useMobileMenu()

  return (
    <>
      <ClientOnly>
        <MobileMenuPortal>
          <nav
            id="mobile-menu"
            aria-label="Nawigacja mobilna"
            aria-hidden={!isOpen}
            className={cx(
              'gradient-brand text-primary-foreground border-border touch-none overflow-x-hidden overflow-y-auto rounded-3xl border bg-linear-to-br lg:hidden',
              'fixed flex flex-1 flex-col items-center justify-center gap-16',
              'top-[calc(var(--spacing)*20+var(--spacing)*6*2)] z-100 max-md:top-[calc(var(--spacing)*18+var(--spacing)*6*2)]',
              'h-[calc(100dvh-var(--spacing)*20-var(--spacing)*6*3)] max-md:h-[calc(100dvh-var(--spacing)*18-var(--spacing)*6*3)]',
              'left-[calc(var(--spacing)*10)] max-md:left-[calc(var(--spacing)*8)] max-sm:left-[calc(var(--spacing)*6)]',
              'w-[calc(100vw-var(--spacing)*10*2)] max-md:w-[calc(100vw-var(--spacing)*8*2)] max-sm:w-[calc(100vw-var(--spacing)*6*2)]',
              !touchStart && 'transition-all ease-in-out',
            )}
            style={style}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <NavLinks onNavLinkClick={() => setIsOpen(false)} />
          </nav>
        </MobileMenuPortal>
      </ClientOnly>
      <Hamburger
        isOpen={isOpen}
        onToggle={() => setIsOpen(prev => !prev)}
        menuId="mobile-menu"
      />
    </>
  )
}

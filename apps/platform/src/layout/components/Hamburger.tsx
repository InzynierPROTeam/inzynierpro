import { cx } from 'class-variance-authority'

type HamburgerProps = {
  isOpen: boolean
  onToggle: VoidFunction
  className?: string
  menuId?: string
}

export const Hamburger: React.FC<HamburgerProps> = ({ isOpen, onToggle, className, menuId }) => (
  <button
    onClick={onToggle}
    className={cx('text-primary relative h-5 w-6 cursor-pointer lg:hidden', className)}
    type="button"
    aria-label={isOpen ? 'Zamknij menu nawigacyjne' : 'Otwórz menu nawigacyjne'}
    aria-expanded={isOpen}
    aria-controls={menuId}
  >
    <div
      className={cx(
        'absolute h-[2.5px] rounded-full bg-current transition-all',
        isOpen ? 'top-[10px] left-1/2 w-0' : 'top-0 left-0 w-3/5',
      )}
    />
    <div
      className={cx(
        'absolute top-[10px] h-[2.5px] w-full rounded-full bg-current transition-all',
        isOpen ? 'rotate-45 transform' : 'rotate-0 transform',
      )}
    />
    <div
      className={cx(
        'absolute top-[10px] h-[2.5px] w-full rounded-full bg-current transition-all',
        isOpen ? '-rotate-45 transform' : 'rotate-0 transform',
      )}
    />
    <div
      className={cx(
        'absolute left-1/2 h-[2.5px] rounded-full bg-current transition-all',
        isOpen ? 'top-[10px] w-0' : 'top-[20px] w-3/5',
      )}
    />
  </button>
)

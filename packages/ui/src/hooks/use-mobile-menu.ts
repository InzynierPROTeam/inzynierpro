import { useCallback, useMemo, useState } from 'react'

type Direction = 'left' | 'right'

export const useMobileMenu = (direction: Direction = 'right', swipeThreshold: number = 100) => {
  const [isOpen, setIsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]

    if (touch) {
      setTouchStart(touch.clientX)
      setSwipeOffset(0)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null) {
        return
      }

      const currentTouch = e.touches[0]?.clientX ?? 0
      const diff = currentTouch - touchStart

      if (
        (direction === 'left' && diff < 0 && isOpen) ||
        (direction === 'right' && diff > 0 && isOpen)
      ) {
        setSwipeOffset(diff)
      }
    },
    [touchStart, direction, isOpen],
  )

  const handleTouchEnd = useCallback(() => {
    const shouldClose =
      (direction === 'left' && swipeOffset < -swipeThreshold) ||
      (direction === 'right' && swipeOffset > swipeThreshold)

    if (shouldClose) {
      setIsOpen(false)
    }

    setTouchStart(null)
    setSwipeOffset(0)
  }, [swipeOffset, swipeThreshold, direction])

  const style = useMemo(() => {
    if (isOpen) {
      return {
        transform:
          direction === 'left' ? `translateX(${swipeOffset}px)` : `translateX(${swipeOffset}px)`,
      }
    }

    return {
      transform: direction === 'left' ? 'translateX(-150%)' : 'translateX(150%)',
    }
  }, [isOpen, swipeOffset, direction])

  return {
    isOpen,
    setIsOpen,
    touchStart,
    swipeOffset,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    style,
  }
}

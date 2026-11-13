import type React from 'react'
import { useInView } from 'react-intersection-observer'
import { cn } from 'tailwind-variants'

type InViewProps = { fetchNextPage: VoidFunction; className?: string }

export const InView: React.FC<InViewProps> = ({ fetchNextPage, className }) => {
  const { ref } = useInView({
    fallbackInView: false,
    onChange: inView => {
      if (inView) {
        fetchNextPage()
      }
    },
  })

  return (
    <div
      ref={ref}
      className={cn('invisible -translate-y-[70dvh] max-md:-translate-y-[100dvh]', className)}
    />
  )
}

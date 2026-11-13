import { cx, tv, type VariantProps } from 'tailwind-variants'

import { Skeleton } from './skeleton.js'

// Each line is one line box tall: a bar as tall as the font size (1em), centred by margins that
// take up the rest of the line height (1lh). Sizes resolve against the text styles on the root,
// so an unset size or leading inherits the surrounding text and still matches it exactly.
// The root is a flex column, so the line margins never collapse into each other or the parent.
const textSkeletonVariants = tv({
  slots: {
    root: 'flex w-full flex-col',
    line: 'my-[calc((1lh_-_1em)/2)] h-[1em] w-full rounded-[0.25em]',
  },
  variants: {
    size: {
      '2xs': { root: 'text-2xs' },
      xs: { root: 'text-xs' },
      sm: { root: 'text-sm' },
      base: { root: 'text-base' },
      lg: { root: 'text-lg' },
      xl: { root: 'text-xl' },
      '2xl': { root: 'text-2xl' },
      '3xl': { root: 'text-3xl' },
      '4xl': { root: 'text-4xl' },
      '5xl': { root: 'text-5xl' },
    },
    leading: {
      none: { root: 'leading-none' },
      tight: { root: 'leading-tight' },
      snug: { root: 'leading-snug' },
      normal: { root: 'leading-normal' },
      relaxed: { root: 'leading-relaxed' },
      loose: { root: 'leading-loose' },
    },
  },
})

type TextSkeletonProps = Omit<React.ComponentProps<'div'>, 'children'> &
  VariantProps<typeof textSkeletonVariants> & {
    /** Number of text lines. The last of several lines takes three fifths of the width. */
    lines?: number
    lineClassName?: string
  }

function TextSkeleton({
  className,
  lineClassName,
  size,
  leading,
  lines = 1,
  ...props
}: TextSkeletonProps) {
  const styles = textSkeletonVariants({ size, leading })

  return (
    <div
      data-slot="text-skeleton"
      aria-hidden="true"
      className={styles.root({ className })}
      {...props}
    >
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={styles.line({
            className: cx(lines > 1 && index === lines - 1 && 'w-3/5', lineClassName),
          })}
        />
      ))}
    </div>
  )
}

export { TextSkeleton, textSkeletonVariants }

export type { TextSkeletonProps }

import { cx, type CxOptions, cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs))
}

export { cx, cva, type VariantProps }

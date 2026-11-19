import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from 'tailwind-variants'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer bg-input/90 focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-checked:bg-primary relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background pointer-events-none block size-4 translate-x-0.5 rounded-full shadow-sm ring-0 transition-transform data-checked:translate-x-[calc(100%+2px)]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

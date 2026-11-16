import { CheckboxGroup as CheckboxGroupPrimitive } from '@base-ui/react/checkbox-group'
import { cn } from 'tailwind-variants'

function CheckboxGroup({ className, ...props }: CheckboxGroupPrimitive.Props) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={cn('grid w-full gap-3', className)}
      {...props}
    />
  )
}

export { CheckboxGroup }

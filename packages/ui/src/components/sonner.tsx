import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import * as React from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    toastOptions={{
      classNames: {
        toast:
          'group-toast cn-toast !bg-background/60 backdrop-blur-xl !text-foreground !border !border-border shadow-lg',
        description: '!text-foreground/50',
        actionButton: '!bg-primary !text-primary-foreground font-medium',
        cancelButton: '!bg-muted !text-muted-foreground !font-medium',
        success: '!border-success/20',
        error: '!border-destructive/50',
      },
    }}
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    className="toaster group"
    style={
      // SAFETY: The surrounding validation or API contract guarantees this asserted type.
      {
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }

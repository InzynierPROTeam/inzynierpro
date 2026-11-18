import { formatDatePickerLabel } from '@inzpro/utils/date'
import { CalendarIcon } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { Button } from './button.js'
import { Calendar, type CalendarProps } from './calendar.js'
import { Popover, PopoverContent, PopoverTrigger } from './popover.js'

type DatePickerProps = {
  placeholder: string
  value: Date | null
  onChange: (value: Date) => void
  onBlur?: () => void
  invalid?: boolean
} & Pick<CalendarProps, 'startMonth' | 'endMonth' | 'disabled' | 'timeZone'> &
  Pick<React.ComponentProps<'button'>, 'id' | 'aria-label' | 'aria-describedby'>

export function DatePicker({
  placeholder,
  value,
  onChange,
  onBlur,
  invalid,
  startMonth,
  endMonth,
  disabled,
  timeZone,
  ...triggerProps
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen)

        if (!isOpen) {
          onBlur?.()
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className="data-[empty=true]:text-muted-foreground justify-start font-normal"
            data-empty={value === null}
            {...triggerProps}
          />
        }
      >
        <CalendarIcon />
        {value === null ? placeholder : formatDatePickerLabel(value)}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          required
          selected={value ?? undefined}
          defaultMonth={value ?? startMonth}
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={disabled}
          timeZone={timeZone}
          onSelect={date => {
            onChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

import type React from 'react'

const digits = Array.from({ length: 10 }, (_, digit) => digit)

type OdometerProps = { value: number; entered: boolean }

/**
 * A whole number whose digits roll up from zero once `entered`. Wider columns settle first and the
 * ones digit last, so the number reads as one count rather than columns moving in lockstep.
 */
export const Odometer: React.FC<OdometerProps> = ({ value, entered }) => {
  const columns = String(value).split('').map(Number)

  return (
    <span className="inline-flex tabular-nums">
      {columns.map((digit, index) => (
        <span
          // Columns keep their place value as the number changes.
          key={columns.length - index}
          className="inline-block h-[1lh] overflow-hidden"
        >
          <span
            className="ease-out-strong flex flex-col transition-transform motion-reduce:transition-none"
            style={{
              transform: `translateY(${entered ? -digit * 10 : 0}%)`,
              transitionDuration: `${700 + index * 90}ms`,
            }}
          >
            {digits.map(shown => (
              <span key={shown}>{shown}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}

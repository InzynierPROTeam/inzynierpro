import { useEffect, useState } from 'react'

/**
 * False on the first paint and true from the next frame, so a CSS transition plays an entrance
 * from its start values to the ones rendered once this is true.
 */
export const useEntered = () => {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  return entered
}

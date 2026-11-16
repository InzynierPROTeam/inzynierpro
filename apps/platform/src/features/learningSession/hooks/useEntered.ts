import { useEffect, useState } from 'react'

export const useEntered = () => {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  return entered
}

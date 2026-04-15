import { useRef, useCallback } from 'react'

export function useThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  const lastCall = useRef(0)
  const fnRef    = useRef(fn)

  fnRef.current = fn

  return useCallback((...args: unknown[]) => {
    const now = Date.now()
    if (now - lastCall.current >= delay) {
      lastCall.current = now
      fnRef.current(...args)
    }
  }, [delay]) as T
}

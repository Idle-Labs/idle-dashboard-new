import { useRef, useEffect } from 'react'

export function usePrevious<T>(value: T): T | undefined {
  // Create a ref to store the previous value
  const previousValue = useRef<T>()

  // Update the ref with the current value on each render
  useEffect(() => {
    previousValue.current = value;
  }, [value])

  // Return the previous value
  return previousValue.current
}
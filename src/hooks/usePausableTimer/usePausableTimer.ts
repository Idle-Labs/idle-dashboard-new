import { useState, useEffect, useRef, useCallback } from 'react'

export type PausableTimerReturns = {
  status: string
  start: Function
  pause: Function
  resume: Function
  stop: Function
}

export function usePausableTimer (func: Function, delay: number): PausableTimerReturns {
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null)
  const [ status, setStatus ] = useState<string>('stopped')
  const [ startTime, setStartTime ] = useState<number | null>(null)
  const [ remainingTime, setRemainingTime ] = useState<number | null>(null)

  const clear = useCallback(() => {
    if (timeoutRef.current){
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      return true
    }
    return false
  }, [timeoutRef])

  const stop = useCallback(() => {
    clear()
    setStartTime(null)
    setStatus('stopped')
    setRemainingTime(null)
  }, [clear])

  const start = useCallback( (interval: number = delay) => {
    // console.log('PausableTimer - START')
    clear()
    const startTime = Date.now()
    setStartTime(startTime)
    setStatus('running')
    
    timeoutRef.current = setTimeout(() => {
      func()
      stop()
    }, interval)

    return startTime
  }, [func, delay, clear, stop])

  const pause = useCallback(() => {
    if (!startTime || status==='paused') return
    clear()
    const remainingTime = Date.now()-startTime
    setRemainingTime(remainingTime)
    setStatus('paused')
    return remainingTime
  }, [status, startTime, clear])

  const resume = useCallback(() => {
    if (remainingTime){
      start(remainingTime)
      setStatus('running')
      return remainingTime
    }
  }, [start, remainingTime])

  return {
    status,
    start,
    pause,
    resume,
    stop
  }
}
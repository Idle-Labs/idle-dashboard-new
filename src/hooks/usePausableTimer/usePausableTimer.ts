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

  const start = useCallback( (interval: number = delay, restartStartTime: boolean = true) => {
    // console.log('PausableTimer - START')
    clear()
    setStatus('running')
    
    timeoutRef.current = setTimeout(() => {
      func()
      stop()
    }, interval)

    if (restartStartTime){
      const newStartTime = Date.now()
      setStartTime(newStartTime)
    }
  }, [func, delay, clear, stop])

  const pause = useCallback(() => {
    if (!startTime || status==='paused') return
    clear()
    const elapsedTime = Date.now()-startTime
    const newRemainingTime = (remainingTime || delay)-elapsedTime
    setRemainingTime(newRemainingTime)
    setStatus('paused')
    console.log('pause', delay, startTime, elapsedTime, newRemainingTime)
    return newRemainingTime
  }, [status, startTime, clear, delay, remainingTime])

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
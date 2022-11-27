import localforage from 'localforage';
import { useState, useEffect, useCallback, useRef } from 'react';

type HookMethods = [
  any,
  ( value: any ) => void,
  () => void,
  boolean,
  boolean
];

export default function useLocalForge ( key: string, initialValue?: any ): HookMethods {
  const [isLoaded, setLoaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [storedValue, setStoredValue] = useState(initialValue)

  const processingRef = useRef(processing)

  useEffect(() => {
    processingRef.current = processing
  }, [processing])

  const waitUntilProcessed = async () => {
    // Save cached requests
    await (new Promise(async (resolve, reject) => {
      const checkProcessing = () => {
        if (processingRef.current){
          setTimeout(checkProcessing, 50)
        } else {
          resolve(true)
        }
      }
      checkProcessing()
    }))
  }
  
  /** Set value */
  const set = useCallback(( value: any ) => {
    ;(async function () {
      await waitUntilProcessed()
      setProcessing(true)
      try {
        await localforage.setItem(key, value)
        setProcessing(false)
        setStoredValue(value)
      } catch (err) {
        setProcessing(false)
        return initialValue
      }
    })()
  }, [key, initialValue])
  
  /** Removes value from local storage */
  const remove = useCallback(() => {
    setProcessing(true)
    ;(async function () {
      try {
        await localforage.removeItem(key)
        setProcessing(false)
        setStoredValue(null)
      } catch (e) {
        setProcessing(false)
      }
    })()
  }, [key])

  useEffect(() => {
    ;(async function () {
      try {
        const value = await localforage.getItem(key)
        if ((value === null || value === undefined) && initialValue){
          set(initialValue)
          setStoredValue(initialValue)
        } else {
          setStoredValue(value)
        }
        setLoaded(true)
      } catch ( err ) {
        return initialValue;
      }
    })()
  // eslint-disable-next-line
  }, [])
  
  return [storedValue, set, remove, isLoaded, processing];
}
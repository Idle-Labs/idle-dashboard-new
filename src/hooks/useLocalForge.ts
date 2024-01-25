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
  const [processing, setProcessing] = useState<any>(false)
  const [storedValue, setStoredValue] = useState(initialValue)

  const processingRef = useRef(processing)

  useEffect(() => {
    processingRef.current = processing
  }, [processing])

  const waitUntilProcessed = async () => {
    // Save cached requests
    await (new Promise( (resolve/*, reject*/) => {
      const checkProcessing = () => {
        if (processingRef.current){
          // console.log('localforage still processing', key, processingRef.current)
          setTimeout(checkProcessing, 10)
        } else {
          resolve(true)
        }
      }
      checkProcessing()
    }))
  }
  
  /** Set value */
  const set = useCallback(async ( value: any ) => {
    await waitUntilProcessed()
    setProcessing('set')
    try {
      await localforage.setItem(key, value)
      setProcessing(false)
      setStoredValue(value)
    } catch (err) {
      setProcessing(false)
      return initialValue
    }
  // eslint-disable-next-line
  }, [key, initialValue])
  
  /** Removes value from local storage */
  const remove = useCallback(async () => {
    setProcessing('remove')
    try {
      await localforage.removeItem(key)
      setStoredValue(null)
      setProcessing(false)
      console.log('removed ', key)
    } catch (err) {
      console.log('remove key error', err)
      setProcessing(false)
    }
  }, [key])

  useEffect(() => {
    (async function () {
      try {
        const value = await localforage.getItem(key)
        if ((value === null || value === undefined) && initialValue){
          console.log('setDefaultValue', key, initialValue)
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
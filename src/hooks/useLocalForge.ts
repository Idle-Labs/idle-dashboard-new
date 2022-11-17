import localforage from 'localforage';
import { useState, useEffect, useCallback } from 'react';

type HookMethods = [
  any,
  ( value: any ) => void,
  () => void,
  boolean
];

export default function useLocalForge ( key: string, initialValue?: any ): HookMethods {
  const [isLoaded, setLoaded] = useState(false);
  const [storedValue, setStoredValue] = useState(initialValue);
  
  /** Set value */
  const set = useCallback(( value: any ) => {
    ;(async function () {
      try {
        await localforage.setItem(key, value);
        setStoredValue(value);
      } catch (err) {
        return initialValue;
      }
    })()
  }, [key, initialValue])
  
  /** Removes value from local storage */
  const remove = useCallback(() => {
    ;(async function () {
      try {
        await localforage.removeItem(key);
        setStoredValue(null);
      } catch (e) {}
    })()
  }, [key])

  useEffect(() => {
    ;(async function () {
      try {
        const value = await localforage.getItem(key);
        if (!value && initialValue){
          set(initialValue);
          setStoredValue(initialValue);
        } else {
          setStoredValue(value);
        }
        setLoaded(true)
      } catch ( err ) {
        return initialValue;
      }
    })()
  // eslint-disable-next-line
  }, [])
  
  return [storedValue, set, remove, isLoaded];
}
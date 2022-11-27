import { hashCode } from 'helpers/'
import useLocalForge from 'hooks/useLocalForge'
import type { ProviderProps } from './common/types'
import React, { useContext, useCallback, useEffect, useMemo } from 'react'

export type CacheContextProps = {
  fetchUrl: Function
  saveData: Function
  getCachedUrl: Function
  checkAndCache: Function
  isLoaded: boolean
  processing: boolean
}

const initialState = {
  isLoaded: false,
  processing: false,
  fetchUrl: () => {},
  saveData: () => {},
  getCachedUrl: () => {},
  checkAndCache: () => {},
}

const CacheContext = React.createContext<CacheContextProps>(initialState)
export const useCacheProvider = () => useContext(CacheContext)

type CacheProviderProps = {
  TTL: number
} & ProviderProps

export const CacheProvider = ({ children, TTL: defaultTTL = 300 }: CacheProviderProps) => {
  const [ cachedRequests, setCachedRequests, , isLoaded, processing ] = useLocalForge('cachedRequests', {})

  const requestQueue = useMemo(() => new Map(), [])

  const processQueue = useCallback(async () => {
    if (!requestQueue.size) return

    const newEntries = Object.fromEntries(requestQueue)
    const processedKeys = Object.keys(newEntries)

    const cachedRequestsMap = new Map(Object.entries({
      ...cachedRequests,
      ...newEntries
    }))

    setCachedRequests(Object.fromEntries(cachedRequestsMap))
  }, [requestQueue, setCachedRequests, cachedRequests])

  const getUrlHash = (url: string) => hashCode(url.toLowerCase())

  const getCachedUrl = useCallback( (url: string, callback?: Function): any => {

    const urlHash = getUrlHash(url)
    const timestamp = Date.now()
    const cachedRequest = cachedRequests[urlHash]

    // console.log('getCachedUrl', url, cachedRequest)

    if (cachedRequest && (!cachedRequest.expirationDate || cachedRequest.expirationDate>timestamp)) {
      return cachedRequest
    }

    if (callback){
      return callback()
    }

    return null
  }, [cachedRequests])

  const saveData = useCallback( (url: string, data: any, TTL: number = defaultTTL, extraData?: any): any => {
    const timestamp = Date.now()
    const urlHash = getUrlHash(url)
    const expirationDate = !TTL ? null : timestamp+(TTL*1000)

    requestQueue.set(urlHash, {
      data,
      timestamp,
      expirationDate
    })

    console.log('saveData', url, urlHash, {
      data,
      timestamp,
      extraData,
      expirationDate
    })

    processQueue()

    return data
  }, [requestQueue, processQueue, defaultTTL])

  const checkAndCache = useCallback( async (url: string, asyncFunc?: Function, TTL: number = defaultTTL): Promise<any> => {
    // Get cached data
    const cachedData = getCachedUrl(url)
    if (cachedData){
      // console.log('checkAndCache - CACHED', url, cachedData)
      return cachedData.data
    }

    if (!asyncFunc) return null

    const data = await asyncFunc()
    if (data){
      // console.log('checkAndCache - Fetch & Save', url, data)
      return saveData(url, data, TTL);
    }

    return null

  }, [getCachedUrl, saveData, defaultTTL])

  const fetchUrl = useCallback( (url: string, TTL: number = defaultTTL) => {
    // Get cached data
    const cachedData = getCachedUrl(url)
    if (cachedData) return cachedData.data

    // Fetch and save
    return fetch(url)
      .then(response => response.json())
      .then(json => saveData(url, json.results, TTL))

  }, [getCachedUrl, saveData, defaultTTL])

  return (
    <CacheContext.Provider value={{ fetchUrl, saveData, getCachedUrl, checkAndCache, isLoaded, processing }}>
      {children}
    </CacheContext.Provider>
  )
}

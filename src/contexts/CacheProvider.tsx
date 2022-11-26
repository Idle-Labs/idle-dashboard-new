import { hashCode } from 'helpers/'
import useLocalForge from 'hooks/useLocalForge'
import type { ProviderProps } from './common/types'
import React, { useContext, useCallback, useEffect, useMemo, useRef } from 'react'

type ContextProps = {
  fetchUrl: Function
  saveData: Function
  getCachedUrl: Function
  checkAndCache: Function
}

const initialState = {
  fetchUrl: () => {},
  saveData: () => {},
  getCachedUrl: () => {},
  checkAndCache: () => {},
}

const CacheContext = React.createContext<ContextProps>(initialState)
export const useCacheProvider = () => useContext(CacheContext)

type CacheProviderProps = {
  TTL: number
} & ProviderProps

export const CacheProvider = ({ children, TTL: defaultTTL = 300 }: CacheProviderProps) => {
  const [ cachedRequests, setCachedRequests, , , processing ] = useLocalForge('cachedRequests', {})

  const processingRef = useRef(processing)
  const cachedRequestsRef = useRef(cachedRequests)

  const requestQueue = useMemo(() => new Map(), [])

  const processQueue = useCallback(async () => {
    if (!requestQueue.size) return

    // Save cached requests
    await (new Promise(async (resolve, reject) => {
      const checkProcessing = () => {
        console.log('CHECK processing', processingRef.current)
        if (processingRef.current){
          setTimeout(checkProcessing, 10)
        } else {
          resolve(true)
        }
      }
      checkProcessing()
    }))

    const newEntries = Object.fromEntries(requestQueue)
    const processedKeys = Object.keys(newEntries)

    const newCachedRequests = {
      ...cachedRequestsRef.current,
      ...newEntries
    }

    setCachedRequests(newCachedRequests)

    // console.log('processing_2', processing)

    processedKeys.forEach( key => {
      requestQueue.delete(key)
    })

    console.log('processQueue', newEntries, newCachedRequests)
  }, [requestQueue, setCachedRequests])

  useEffect(() => {
    console.log('SET processing', processing)
    processingRef.current = processing
    cachedRequestsRef.current = cachedRequests
  }, [processing, cachedRequests])

  const getUrlHash = (url: string) => hashCode(url.toLowerCase())

  const getCachedUrl = useCallback( (url: string, callback?: Function): any => {
    const urlHash = getUrlHash(url)
    const currTime = Date.now()
    const cachedRequest = cachedRequests[urlHash]

    console.log('getCachedUrl', url, cachedRequest)

    if (cachedRequest?.expirationDate>currTime) {
      return cachedRequest.data
    }

    if (callback){
      return callback()
    }

    return null
  }, [cachedRequests])

  const saveData = useCallback( (url: string, data: any, TTL: number = defaultTTL): any => {
    const urlHash = getUrlHash(url)
    const expirationDate = +Date.now()+(TTL*1000)

    requestQueue.set(urlHash, {
      data,
      expirationDate
    })

    console.log('saveData', url, urlHash, {
      data,
      expirationDate
    })

    processQueue()

    return data
  }, [requestQueue, processQueue, defaultTTL])

  const checkAndCache = useCallback( async (url: string, asyncFunc: Function, TTL: number = defaultTTL): Promise<any> => {
    // Get cached data
    const cachedData = getCachedUrl(url)
    if (cachedData){
      console.log('checkAndCache - CACHED', url, cachedData)
      return cachedData
    }

    const data = await asyncFunc()
    console.log('checkAndCache - FETCH', url, data)
    if (data){
      return saveData(url, data, TTL);
    }

    return null

  }, [getCachedUrl, saveData, defaultTTL])

  const fetchUrl = useCallback( (url: string, TTL: number = defaultTTL) => {
    // Get cached data
    const cachedData = getCachedUrl(url)
    if (cachedData) return cachedData

    // Fetch and save
    return fetch(url)
      .then(response => response.json())
      .then(json => saveData(url, json.results, TTL))

  }, [getCachedUrl, saveData, defaultTTL])

  return (
    <CacheContext.Provider value={{ fetchUrl, saveData, getCachedUrl, checkAndCache }}>
      {children}
    </CacheContext.Provider>
  )
}

import localforage from 'localforage'
import { hashCode, asyncWait } from 'helpers/'
import { CACHE_VERSION } from 'constants/vars'
import useLocalForge from 'hooks/useLocalForge'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { preCachedRequests } from 'constants/historicalData'
import React, { useContext, useCallback, useMemo, useEffect, useRef } from 'react'

export type CacheContextProps = {
  saveData: Function
  getUrlHash: Function
  getCachedUrl: Function
  checkAndCache: Function
  removeCachedUrl: Function
  isLoaded: boolean
}

const initialState = {
  isLoaded: false,
  saveData: () => {},
  getUrlHash: () => {},
  getCachedUrl: () => {},
  checkAndCache: () => {},
  removeCachedUrl: () => {}
}

const CacheContext = React.createContext<CacheContextProps>(initialState)
export const useCacheProvider = () => useContext(CacheContext)

type CacheProviderProps = {
  TTL: number
} & ProviderProps

type CachedItem = {
  data: any
  timestamp: number
  expirationDate: number | null
}

export const CacheProvider = ({ children, TTL: defaultTTL = 300 }: CacheProviderProps) => {
  const { chainId } = useWalletProvider()
  const [ cacheVersion, setCacheVersion, , isLoaded ] = useLocalForge('cacheVersion')
  // const [ cachedRequests, setCachedRequests, , isLoaded, processing ] = useLocalForge(`cachedRequests`, preCachedRequests)

  const processingRef = useRef<boolean>(false)

  const initCache = useCallback( async () => {
    const promises = Object.keys(preCachedRequests).map( (hash: string) => {
      const data = preCachedRequests[hash]
      return localforage.setItem(`cachedRequests_${hash}`, data)
    } )

    processingRef.current = true
    await localforage.clear()
    await Promise.all(promises)
    await localforage.setItem('cachedRequests_timestamp', Date.now())
    processingRef.current = false

  }, [])

  // @ts-ignore
  window.initCache = initCache

  // Check preCachedData version
  useEffect(() => {
    if (!isLoaded || cacheVersion === CACHE_VERSION) return
    initCache()
    setCacheVersion(CACHE_VERSION)
    // eslint-disable-next-line
    console.log('CACHE VERSION UPGRADE FROM %s to %s', cacheVersion, CACHE_VERSION)
  }, [cacheVersion, chainId, isLoaded, initCache, setCacheVersion])

  const cacheIsLoaded = useMemo(() => {
    return isLoaded && cacheVersion === CACHE_VERSION
  }, [cacheVersion, isLoaded])

  const requestQueue: Map<string, CachedItem> = useMemo(() => new Map(), [])

  const waitProcessed = useCallback(async () => {
    return new Promise( async (resolve) => {
      // Wait until processing = False
      while (processingRef.current){
        await asyncWait(100)
      }
      resolve(true)
    });
  }, [])

  const processQueue = useCallback(async () => {
    await waitProcessed()

    // Exit if queue empty
    if (!requestQueue.size) return

    // Start processing
    processingRef.current = true

    const processedKeys = Array.from(requestQueue.keys())

    const promises = processedKeys.map( (hash: string) => {
      const data = requestQueue.get(hash)
      return localforage.setItem(hash, data)
    })

    await Promise.all(promises)

    // Clear queue
    processedKeys.forEach( hash => {
      requestQueue.delete(hash)
    })

    // End processing
    processingRef.current = false
  }, [requestQueue, waitProcessed])

  const getUrlHash = (url: string) => {
    return url ? `cachedRequests_${hashCode(url.toLowerCase())}` : null
  }

  const removeCachedUrl = useCallback( async (url: string): Promise<any> => {
    const hash = getUrlHash(url)
    if (!hash) return null
    return await localforage.removeItem(hash)
  }, [])

  const getCachedUrl = useCallback( async (url: string, callback?: Function): Promise<CachedItem | null> => {

    const hash = getUrlHash(url)
    if (!hash) return null

    const timestamp = Date.now()
    // const cachedRequest = cachedRequests[hash]
    const cachedRequest: CachedItem | null = await localforage.getItem(hash)

    // console.log('getCachedUrl', url, cachedRequest)

    if (cachedRequest && (!cachedRequest.expirationDate || cachedRequest.expirationDate>timestamp)) {
      return cachedRequest
    }

    if (callback){
      return callback()
    }

    return null
  }, [])

  const saveData = useCallback( (url: string, data: any, TTL: number = defaultTTL/*, extraData?: any*/): any => {
    const timestamp = Date.now()
    const hash = getUrlHash(url)

    if (!hash) return data

    const expirationDate = !TTL ? null : timestamp+(TTL*1000)

    requestQueue.set(hash, {
      data,
      timestamp,
      expirationDate
    })

    // console.log('saveData', url, hash, {
    //   data,
    //   timestamp,
    //   extraData,
    //   expirationDate
    // })

    processQueue()

    return data
  }, [requestQueue, processQueue, defaultTTL])

  const checkAndCache = useCallback( async (url: string, asyncFunc?: Function, TTL: number = defaultTTL): Promise<CachedItem["data"] | null> => {

    // Get cached data
    const cachedData = await getCachedUrl(url)
    if (cachedData){
      return cachedData.data
    }

    if (!asyncFunc) return null

    const data = await asyncFunc()
    if (data){
      return saveData(url, data, TTL);
    }
    return null
  }, [getCachedUrl, saveData, defaultTTL])

  useEffect(() => {
    (async function () {
      try {
        const initTimestamp = await localforage.getItem('cachedRequests_timestamp')
        if ((initTimestamp === null || initTimestamp === undefined)){
          await initCache()
        }
      } catch ( err ) {
        
      }
    })()
  // eslint-disable-next-line
  }, [])

  return (
    <CacheContext.Provider value={{ saveData, removeCachedUrl, getUrlHash, getCachedUrl, checkAndCache, isLoaded: cacheIsLoaded }}>
      {children}
    </CacheContext.Provider>
  )
}

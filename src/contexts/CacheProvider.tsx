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
  isLoaded: boolean
}

const initialState = {
  isLoaded: false,
  saveData: () => {},
  getUrlHash: () => {},
  getCachedUrl: () => {},
  checkAndCache: () => {}
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
  const { chainId, isChainLoaded } = useWalletProvider()
  const [ cacheVersion, setCacheVersion, , isLoaded ] = useLocalForge('cacheVersion')
  // const [ cachedRequests, setCachedRequests, , isLoaded, processing ] = useLocalForge(`cachedRequests`, preCachedRequests)

  const processingRef = useRef<boolean>(false)

  const initCache = useCallback( async () => {
    const promises = Object.keys(preCachedRequests).map( (urlHash: string) => {
      const data = preCachedRequests[urlHash]
      return localforage.setItem(`cachedRequests_${urlHash}`, data)
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
    if (!isLoaded || !isChainLoaded || cacheVersion === CACHE_VERSION) return
    initCache()
    setCacheVersion(CACHE_VERSION)
    // eslint-disable-next-line
    console.log('CACHE VERSION UPGRADE FROM %s to %s', cacheVersion, CACHE_VERSION)
  }, [cacheVersion, chainId, isChainLoaded, isLoaded, initCache, setCacheVersion])

  const cacheIsLoaded = useMemo(() => {
    return isLoaded && isChainLoaded && cacheVersion === CACHE_VERSION
  }, [cacheVersion, isChainLoaded, isLoaded])

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

    const promises = processedKeys.map( (urlHash: string) => {
      const data = requestQueue.get(urlHash)
      return localforage.setItem(urlHash, data)
    })

    await Promise.all(promises)

    // Clear queue
    processedKeys.forEach( urlHash => {
      requestQueue.delete(urlHash)
    })

    // End processing
    processingRef.current = false
  }, [requestQueue, waitProcessed])

  const getUrlHash = (url: string) => {
    return url ? `cachedRequests_${hashCode(url.toLowerCase())}` : null
  }

  const getCachedUrl = useCallback( async (url: string, callback?: Function): Promise<CachedItem | null> => {

    const urlHash = getUrlHash(url)
    if (!urlHash) return null

    const timestamp = Date.now()
    // const cachedRequest = cachedRequests[urlHash]
    const cachedRequest: CachedItem | null = await localforage.getItem(urlHash)

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
    const urlHash = getUrlHash(url)

    if (!urlHash) return data

    const expirationDate = !TTL ? null : timestamp+(TTL*1000)

    requestQueue.set(urlHash, {
      data,
      timestamp,
      expirationDate
    })

    // console.log('saveData', url, urlHash, {
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
    <CacheContext.Provider value={{ saveData, getUrlHash, getCachedUrl, checkAndCache, isLoaded: cacheIsLoaded }}>
      {children}
    </CacheContext.Provider>
  )
}

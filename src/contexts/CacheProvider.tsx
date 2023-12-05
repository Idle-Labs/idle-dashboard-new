import localforage from 'localforage'
import { hashCode, isEmpty } from 'helpers/'
import { CACHE_VERSION } from 'constants/vars'
import useLocalForge from 'hooks/useLocalForge'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { preCachedRequests } from 'constants/historicalData'
import React, { useContext, useCallback, useMemo, useEffect, useState } from 'react'

export type CacheContextProps = {
  saveData: Function
  getUrlHash: Function
  getCachedUrl: Function
  checkAndCache: Function
  isLoaded: boolean
  processing: boolean
}

const initialState = {
  isLoaded: false,
  processing: false,
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
  const [ processing, setProcessing ] = useState<boolean>(false)
  const [ cacheVersion, setCacheVersion, , isLoaded ] = useLocalForge('cacheVersion')
  // const [ cachedRequests, setCachedRequests, , isLoaded, processing ] = useLocalForge(`cachedRequests`, preCachedRequests)

  const initCache = useCallback( async () => {
    const promises = Object.keys(preCachedRequests).map( (urlHash: string) => {
      const data = preCachedRequests[urlHash]
      return localforage.setItem(`cachedRequests_${urlHash}`, data)
    } )

    setProcessing(true)
    await localforage.clear()
    await Promise.all(promises)
    await localforage.setItem('cachedRequests_timestamp', Date.now())
    setProcessing(false)

  }, [setProcessing])

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

  const requestQueue: Record<string, CachedItem> = useMemo(() => ({}), [])

  const processQueue = useCallback(async () => {
    if (isEmpty(requestQueue)) return

    const processedKeys = Object.keys(requestQueue)

    const promises = processedKeys.map( (urlHash: string) => {
      const data = requestQueue[urlHash]
      return localforage.setItem(urlHash, data)
    })

    setProcessing(true)
    await Promise.all(promises)
    setProcessing(false)

    // Clear queue
    processedKeys.forEach( urlHash => {
      delete requestQueue[urlHash]
    })

    /*
    const cachedRequestsMap = new Map(Object.entries({
      ...cachedRequests,
      ...newEntries
    }))

    // For Precached data
    // console.log('cachedRequests', Object.fromEntries(cachedRequestsMap))

    setCachedRequests(Object.fromEntries(cachedRequestsMap))
    */
  }, [requestQueue, setProcessing])

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

    requestQueue[urlHash] = {
      data,
      timestamp,
      expirationDate
    }

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
    <CacheContext.Provider value={{ saveData, getUrlHash, getCachedUrl, checkAndCache, isLoaded: cacheIsLoaded, processing }}>
      {children}
    </CacheContext.Provider>
  )
}

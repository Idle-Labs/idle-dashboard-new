import { Location } from 'history'
import { routes } from 'constants/routes'
import { useQuery } from 'hooks/useQuery'
import { sendPageview } from 'helpers/analytics'
import { useLocation, useRoutes, useSearchParams } from 'react-router-dom'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import React, { useMemo, createContext, useContext, useEffect } from 'react'

export type BrowserRouterContextProps = {
  location: Location | null
  searchParams: any
  params: any
  match: any
  query: any
}

const initialState: BrowserRouterContextProps = {
  match: {},
  query: {},
  params: {},
  location: null,
  searchParams: null
}

const BrowserRouterContext = createContext<BrowserRouterContextProps>(initialState)

export const useBrowserRouter = () => useContext(BrowserRouterContext)

export function BrowserRouterProvider() {
  const query = useQuery()
  const location = useLocation()
  const searchParams = useSearchParams()
  const renderedRoutes = useRoutes(routes)
  const { cleanTransaction } = useTransactionManager()
  
  const match = useMemo(() => {
    return renderedRoutes?.props.match
  }, [renderedRoutes])

  const params = useMemo(() => {
    return match?.params || {}
  }, [match])

  const router = useMemo(() => ({
    searchParams,
    location,
    params,
    query,
    match,
  }), [searchParams, location, params, query, match])

  console.log('router', router)

  useEffect(() => {
    window.scrollTo(0, 0)
    sendPageview()
    cleanTransaction()
  }, [location, cleanTransaction])

  return (
    <BrowserRouterContext.Provider value={router}>
      {renderedRoutes}
    </BrowserRouterContext.Provider>
  )
}

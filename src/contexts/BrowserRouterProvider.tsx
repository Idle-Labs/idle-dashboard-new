import { Location } from 'history'
import { routes } from 'constants/routes'
import { useQuery } from 'hooks/useQuery'
import React, { useMemo, createContext, useContext, useEffect } from 'react'
import { useLocation, useRoutes, useSearchParams } from 'react-router-dom'

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
  const renderedRoutes = useRoutes(routes)
  const searchParams = useSearchParams()
  
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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  return (
    <BrowserRouterContext.Provider value={router}>
      {renderedRoutes}
    </BrowserRouterContext.Provider>
  )
}

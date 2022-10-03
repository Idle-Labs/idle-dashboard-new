import { Location } from 'history'
import { routes } from '../constants/routes'
import { useQuery } from '../hooks/useQuery'
// import { ProviderProps } from './common/types'
import React, { useMemo, createContext, useContext } from 'react'
import { useLocation, useParams, useRoutes } from 'react-router-dom'

export type BrowserRouterContextProps<Q, P> = {
  location: Location
  params: P
  query: Q
}

const BrowserRouterContext = createContext<BrowserRouterContextProps<any, any> | null>(null)

export const useBrowserRouter = () => useContext(BrowserRouterContext)

export function BrowserRouterProvider() {
  const location = useLocation()
  const params = useParams()
  const query = useQuery()

  const renderedRoutes = useRoutes(routes);

  const router = useMemo(
    () => ({
      location,
      params,
      query,
    }),
    [location, params, query],
  )

  // console.log('router', router);

  return (
    <BrowserRouterContext.Provider value={router}>
      {renderedRoutes}
    </BrowserRouterContext.Provider>
  )
}

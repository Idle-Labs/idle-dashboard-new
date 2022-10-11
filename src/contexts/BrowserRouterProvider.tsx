import { Location } from 'history'
import { routes } from '../constants/routes'
import { useQuery } from '../hooks/useQuery'
// import { ProviderProps } from './common/types'
import React, { useMemo, createContext, useContext } from 'react'
import { useLocation, useParams, useRoutes, matchPath } from 'react-router-dom'

export type BrowserRouterContextProps = {
  location: Location | null
  params: any
  query: any
}

const initalState: BrowserRouterContextProps = {
  query: {},
  params: {},
  location: null
}

const BrowserRouterContext = createContext<BrowserRouterContextProps>(initalState)

export const useBrowserRouter = () => useContext(BrowserRouterContext)

export function BrowserRouterProvider() {
  const location = useLocation()
  const query = useQuery()

  const renderedRoutes = useRoutes(routes);
  
  const match = useMemo(() => {
    return renderedRoutes?.props.match
  }, [renderedRoutes])

  const params = useMemo(() => {
    return match.params
  }, [match])

  const router = useMemo(
    () => ({
      location,
      params,
      query,
    }),
    [location, params, query],
  )

  return (
    <BrowserRouterContext.Provider value={router}>
      {renderedRoutes}
    </BrowserRouterContext.Provider>
  )
}

import { Location } from 'history'
import { routes } from '../constants/routes'
import { useQuery } from '../hooks/useQuery'
import { useLocation, useRoutes } from 'react-router-dom'
import React, { useMemo, createContext, useContext } from 'react'

export type BrowserRouterContextProps = {
  location: Location | null
  params: any
  match: any
  query: any
}

const initialState: BrowserRouterContextProps = {
  match: {},
  query: {},
  params: {},
  location: null
}

const BrowserRouterContext = createContext<BrowserRouterContextProps>(initialState)

export const useBrowserRouter = () => useContext(BrowserRouterContext)

export function BrowserRouterProvider() {
  const location = useLocation()
  const query = useQuery()

  const renderedRoutes = useRoutes(routes);
  
  const match = useMemo(() => {
    return renderedRoutes?.props.match
  }, [renderedRoutes])

  const params = useMemo(() => {
    return match?.params || {}
  }, [match])

  // console.log('match', match, 'params', params)

  const router = useMemo(
    () => ({
      location,
      params,
      query,
      match
    }),
    [location, params, query, match],
  )

  return (
    <BrowserRouterContext.Provider value={router}>
      {renderedRoutes}
    </BrowserRouterContext.Provider>
  )
}

import { Location } from 'history'
import { routes } from 'constants/routes'
import { useQuery } from 'hooks/useQuery'
import { sendPageview } from 'helpers/analytics'
import { Navigate, RouteObject, useLocation, useRoutes, useSearchParams } from 'react-router-dom'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import React, { useMemo, createContext, useContext, useEffect } from 'react'
import { useThemeProvider } from './ThemeProvider'
import { isEmpty } from 'helpers'

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
  const { environment } = useThemeProvider()
  const { cleanTransaction } = useTransactionManager()

  
  const filteredRoutes = useMemo(() => {
    const route = {...routes[0]}
    route.children = route.children?.filter( (route: RouteObject) => !route.handle || isEmpty(route.handle) || route.handle.includes(environment) )
    route.children?.push(
      {
        index: true,
        element: <Navigate to={`/${route.children[0].path}`} replace />
      },
      {
        path: '*',
        element: <Navigate to={`/${route.children[0].path}`} replace />
      }
    )
    return [route]
  }, [environment])

  const renderedRoutes = useRoutes(filteredRoutes)
  
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
    sendPageview()
    cleanTransaction()
  }, [location, cleanTransaction])

  return (
    <BrowserRouterContext.Provider value={router}>
      {renderedRoutes}
    </BrowserRouterContext.Provider>
  )
}

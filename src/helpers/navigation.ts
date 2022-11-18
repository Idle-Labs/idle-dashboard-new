import { routes } from 'constants/routes'

export const getRoutePath = (path: string, params: string[]): string | null => {
  const route = path === '/' ? routes[0] : routes[0].children?.find( route => route.path === path )
  if (!route || !route.path) return null
  return `/${route.path.replace(/\/$/, "")}/${params.join('/')}`
}
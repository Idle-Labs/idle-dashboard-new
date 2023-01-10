import { routes } from 'constants/routes'
import { LEGACY_DASHBOARD_URL } from 'constants/vars'

export function getRoutePath(path: string, params: string[] = []): string {
  const route = path === '/' ? routes[0] : routes[0].children?.find( route => route.path === path )
  if (!route || !route.path) return '/'
  return `/${route.path.replace(/\/$/, "")}${params.length>0 ? '/'+params.join('/') : ''}`
}

export function getLegacyDashboardUrl(section: string) {
  return `${LEGACY_DASHBOARD_URL}${section}`
}

export function checkSectionEnabled(path: string) {
  return !!routes[0].children?.find( route => route.path?.toLowerCase() === path.toLowerCase() )
}

export function openWindow(url: string) {
  return window.open(url, '_blank', 'noopener');
}
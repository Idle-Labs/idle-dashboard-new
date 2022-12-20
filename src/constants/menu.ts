import { IconType } from './types'
import { getLegacyDashboardUrl } from 'helpers/'
import { StrategyProps, strategies } from 'constants/strategies'

export type MenuListType = {
  path?: string
  link?: string
  label: string
  icon?: IconType
  onClick?: Function
  iconProps?: Record<string, any>
  labelProps?: Record<string, any>
}

export type MenuItemType = MenuListType & {
  color?: string
  children?: MenuListType[]
}

export const menu: MenuItemType[] = [
  {
    path: 'dashboard',
    label: 'navBar.dashboard'
  },
  {
    label: 'navBar.earn',
    children: Object.values(strategies).filter( (strategy: StrategyProps) => strategy.route ).map( (strategy: StrategyProps) => ({
      path: `earn/${strategy.route}`,
      label: strategy.label as string,
      color: strategy.color as string
    }))
  },
  {
    label: 'navBar.legacyApp',
    link: getLegacyDashboardUrl('')
  },
  {
    // path:'governance',
    label: 'navBar.governance',
    link: 'https://www.tally.xyz/gov/eip155:1:0x3D5Fc645320be0A085A32885F078F7121e5E5375'
  },
]
import { IconType } from './types'
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
    path:'dashboard',
    label:'navBar.dashboard'
  },
  {
    label:'navBar.earn',
    children: Object.values(strategies).filter( (strategy: StrategyProps) => strategy.route ).map( (strategy: StrategyProps) => ({
      path:`earn/${strategy.route}`,
      label: strategy.label as string,
      color: strategy.color as string
    }))
  },
  {
    label:'navBar.stake',
    link:'https://app.idle.finance/#/stake'
  },
  {
    // path:'stats',
    label:'navBar.analytics',
    link:'https://app.idle.finance/#/stats'
  },
  {
    // path:'governance',
    label:'navBar.governance',
    link:'https://app.idle.finance/#/governance'
  },
]
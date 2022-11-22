import { IconType } from './types'
import { StrategyProps, strategies } from 'constants/strategies'

export type MenuListType = {
  path?: string
  label: string
  icon?: IconType
  onClick?: Function
  iconProps?: Record<string, any>
  labelProps?: Record<string, any>
}

export type MenuItemType = {
  path?: string
  label: string
  icon?: IconType
  onClick?: Function
  children?: MenuListType[]
  iconProps?: Record<string, any>
  labelProps?: Record<string, any>
}

export const menu: MenuItemType[] = [
  {
    path:'dashboard',
    label:'navBar.dashboard'
  },
  {
    label:'navBar.earn',
    children: Object.values(strategies).map( (strategy: StrategyProps) => ({
      path:`earn/${strategy.route}`,
      label: strategy.label
    }))
  },
  {
    path:'stats',
    label:'navBar.stats'
  },
  {
    path:'stake',
    label:'navBar.stakeGauges'
  },
  {
    path:'governance',
    label:'navBar.governance'
  },
]
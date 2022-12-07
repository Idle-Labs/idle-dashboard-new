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
  color?: string
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
    children: Object.values(strategies).filter( (strategy: StrategyProps) => strategy.route ).map( (strategy: StrategyProps) => ({
      path:`earn/${strategy.route}`,
      label: strategy.label as string,
      color: strategy.color as string
    }))
  },
  // {
  //   path:'stats',
  //   label:'navBar.stats'
  // },
  // {
  //   path:'stake',
  //   label:'navBar.stakeGauges'
  // },
  // {
  //   path:'governance',
  //   label:'navBar.governance'
  // },
]
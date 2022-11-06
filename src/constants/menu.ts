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
    label:'Dashboard'
  },
  {
    label:'Earn',
    children: Object.values(strategies).map( (strategy: StrategyProps) => ({
      path:`earn/${strategy.route}`,
      label: strategy.label
    }))
  },
  {
    path:'stats',
    label:'Stats'
  },
  {
    path:'stake',
    label:'Stake & Vote'
  },
  {
    path:'governance',
    label:'Governance'
  },
]
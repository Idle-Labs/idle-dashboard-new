import { IconType } from './types'

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

type StrategyProps = {
  route: string
  label: string
}

export const strategies:Record<string, StrategyProps> = {
  BY:{
    route:'best-yield',
    label:'Best Yield',
  },
  AA:{
    route:'protected-yield',
    label:'Protected Yield'
  },
  BB:{
    route:'boosted-yield',
    label:'Boosted Yield'
  },
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
import { IconType } from './types'
import { strategiesFolder } from 'constants/folders'

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
  bg: string
  route: string
  label: string
  image: string
  description: string
  showProtocol: boolean
  generalDataFields: string[]
}

export const strategies:Record<string, StrategyProps> = {
  BY:{
    route:'best-yield',
    showProtocol: false,
    label:'strategies.best.title',
    description:'strategies.best.description',
    image: `${strategiesFolder}best-yield.png`,
    bg: `${strategiesFolder}best-yield-bg.svg`,
    generalDataFields:['protocol', 'pool', 'apy', 'rewards']
  },
  AA:{
    showProtocol: true,
    route:'protected-yield',
    label:'strategies.protected.title',
    description:'strategies.protected.description',
    bg: `${strategiesFolder}protected-yield-bg.png`,
    image: `${strategiesFolder}protected-yield.png`,
    generalDataFields:['protocol', 'stakingRewards', 'autoCompounding', 'performanceFee', 'status', 'pool', 'apy', 'apyRatio', 'coverage']
  },
  BB:{
    route:'boosted-yield',
    showProtocol: true,
    label:'strategies.boosted.title',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
    generalDataFields:['protocol', 'stakingRewards', 'autoCompounding', 'performanceFee', 'status', 'pool', 'apy', 'apyRatio', 'apyBoost']
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
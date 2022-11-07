import { strategiesFolder } from 'constants/folders'

export type StrategyProps = {
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
    generalDataFields:['protocol', 'pool', 'apy', 'rewards', 'allocation']
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
    showProtocol: true,
    route:'boosted-yield',
    label:'strategies.boosted.title',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
    generalDataFields:['protocol', 'stakingRewards', 'autoCompounding', 'performanceFee', 'status', 'pool', 'apy', 'apyRatio', 'apyBoost']
  },
}
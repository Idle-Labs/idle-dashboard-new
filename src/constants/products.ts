import { strategiesFolder } from 'constants/folders'
import { strategies, StrategyColumn } from 'constants/strategies'

export type ProductProps = {
  bg?: string
  label: string
  color: string
  route: string
  image?: string
  columns?: StrategyColumn[]
  strategies: (keyof typeof strategies)[]
}

export const products: ProductProps[] = [
  {
    color: '#6AE4FF',
    strategies: ['BY'],
    route: `best-yield`,
    label: 'strategies.best.label',
  },
  {
    color: '#4de3b0',
    route: `tranches`,
    strategies: ['AA', 'BB'],
    label: 'strategies.tranches.label',
    bg: `${strategiesFolder}tranches-bg.png`,
    image: `${strategiesFolder}tranches.png`,
    columns: [
      {
        accessor:'name',
        sortType:'alpha',
        id:'assetWithVariant',
        tables: ['Deposited'],
        stackProps:{
          justifyContent:'space-between'
        },
        extraFields:['actionRequired', 'strategies']
      },
      {
        accessor:'name',
        sortType:'alpha',
        id:'assetWithVariant',
        tables: ['Available'],
        extraFields:['statusBadge']
      },
      {
        accessor:'id',
        id:'protocol',
        sortType:'alpha',
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric',
        tables: ['Deposited']
      },
      {
        title:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric',
        id:'trancheTotalTvl',
        tables: ['Available']
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric',
        tables: ['Deposited']
      },
      {
        accessor:'id',
        id:'seniorApy',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        accessor:'id',
        id:'juniorApy',
        sortType: 'numeric',
        tables: ['Available']
      }
    ]
  }
]
import type { ModalProps } from 'constants/types'
import { strategiesFolder } from 'constants/folders'
import { strategies, StrategyColumn } from 'constants/strategies'

export type ProductProps = {
  bg?: string
  label: string
  color: string
  route: string
  image?: string
  strategy: string
  modal?: ModalProps
  description?: string
  columns?: StrategyColumn[]
  strategies: (keyof typeof strategies)[]
}

export const products: ProductProps[] = [
  {
    strategy:'best',
    color: '#04117B',
    strategies: ['BY'],
    route: `best-yield`,
    label: 'strategies.best.label',
    image: `${strategiesFolder}best-yield.png`,
    description: 'strategies.best.description'
  },
  {
    color: '#008970',
    strategy:'tranches',
    route: `yield-tranches`,
    strategies: ['AA', 'BB'],
    label: 'strategies.tranches.label',
    bg: `${strategiesFolder}tranches-bg.png`,
    image: `${strategiesFolder}tranches.png`,
    description: 'strategies.tranches.description',
    modal:{
      cta:'strategies.tranches.modal.cta',
      text:'strategies.tranches.modal.text',
      title:'strategies.tranches.modal.title',
      subtitle:'strategies.tranches.modal.subtitle'
    },
    columns: [
      {
        accessor:'name',
        sortType:'alpha',
        id:'assetWithStatus',
        tables: ['Deposited'],
        stackProps:{
          justifyContent:'space-between'
        },
        extraFields:['actionRequired', 'strategies']
      },
      {
        accessor:'name',
        sortType:'alpha',
        id:'assetWithStatus',
        tables: ['Available'],
        extraFields:[]
      },
      {
        accessor:'id',
        id:'protocolWithVariant',
        sortType:'alpha',
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric',
        tables: ['Deposited']
      },
      {
        title:'defi.tvl',
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
        sortType: 'trancheApy',
        tables: ['Available']
      },
      {
        accessor:'id',
        id:'juniorApy',
        sortType: 'trancheApy',
        tables: ['Available']
      },
      {
        width: '8%',
        id:'chainId',
        accessor:'id',
        tables: ['Available'],
        stackProps:{
          justifyContent:'center'
        },
      }
    ]
  }
]
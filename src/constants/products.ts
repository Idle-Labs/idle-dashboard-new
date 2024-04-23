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
    label: 'strategies.aggregated.title',
    image: `${strategiesFolder}best-yield.png`,
    description: 'strategies.best.description'
  },
  {
    color: '#008970',
    strategy:'tranches',
    route: `yield-tranches`,
    strategies: ['AA', 'BB'],
    label: 'strategies.isolated.title',
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
        width:'25%',
        accessor:'id',
        id:'vaultOperatorOrProtocol',
        sortType:'alpha',
        tables: ['Deposited'],
        stackProps:{
          justifyContent:'space-between'
        },
        extraFields:['actionRequired', 'strategies']
      },
      {
        width:'25%',
        accessor:'id',
        id:'vaultOperatorOrProtocol',
        sortType:'alpha',
        tables: ['Available'],
        stackProps:{
          justifyContent:'space-between'
        },
      },
      {
        accessor:'name',
        sortType:'alpha',
        id:'asset',
        extraFields:[]
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
        id:'trancheTotalTvl',
        tables: ['Available'],
        sortType: 'totalTvlUsd'
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric',
        tables: ['Deposited'],
        extraFields:['rewardsEmissions'],
        stackProps:{
          spacing: 2,
          direction:'row',
          alignItems:'center',
          justifyContent:'flex-start'
        }
      },
      {
        accessor:'id',
        id:'seniorApy',
        sortType: 'trancheApy',
        tables: ['Available'],
        extraFields:['seniorRewardsEmissions'],
        stackProps:{
          spacing: 2,
          direction:'row',
          alignItems:'center',
          justifyContent:'flex-start'
        }
      },
      {
        accessor:'id',
        id:'juniorApy',
        sortType: 'trancheApy',
        tables: ['Available'],
        extraFields:['juniorRewardsEmissions'],
        stackProps:{
          spacing: 2,
          direction:'row',
          alignItems:'center',
          justifyContent:'flex-start'
        }
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
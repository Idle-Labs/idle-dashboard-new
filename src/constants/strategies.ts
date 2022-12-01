import { strategiesCarouselFolder, strategiesFolder } from 'constants/folders'

export type GeneralDataField = {
  field: string
  label: string
}

export type StrategyCarouselItem = {
  image: string
  title: string
  description: string
}

export type StrategyColumn = {
  id?: any
  title?: any
  accessor: any
  sortType?: 'alpha' | 'numeric'
}

export type StrategyProps = {
  bg: string
  type: string,
  color: string
  route: string
  label: string
  image: string
  description: string
  showProtocol: boolean
  columns: StrategyColumn[]
  generalDataFields: GeneralDataField[]
  carouselItems?: StrategyCarouselItem[]
}

export const strategies: Record<string, StrategyProps> = {
  BY:{
    type:'BY',
    color:'#FFD15C',
    route:'best-yield',
    showProtocol: false,
    label:'strategies.best.title',
    description:'strategies.best.description',
    image: `${strategiesFolder}best-yield.png`,
    bg: `${strategiesFolder}best-yield-bg.svg`,
    carouselItems: [
      {
        image:`${strategiesCarouselFolder}BY-pooled-funds.gif`,
        title:'strategies.best.carousel.pooledDeposits.title',
        description:'strategies.best.carousel.pooledDeposits.description'
      },
      {
        image:`${strategiesCarouselFolder}BY-yield-monitoring.gif`,
        title:'strategies.best.carousel.yieldMonitoring.title',
        description:'strategies.best.carousel.yieldMonitoring.description'
      },
      {
        image:`${strategiesCarouselFolder}BY-dynamic-rebalance.gif`,
        title:'strategies.best.carousel.dynamicRebalance.title',
        description:'strategies.best.carousel.dynamicRebalance.description'
      }
    ],
    columns: [
      {
        id:'asset',
        accessor:'name',
        sortType:'alpha',
        title:'defi.asset'
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric'
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric'
      },
      {
        id:'protocols',
        accessor:'id'
      }
    ],
    generalDataFields:[
      {
        field:'pool',
        label:'assets.assetDetails.generalData.pool'
      },
      {
        field:'apy',
        label:'assets.assetDetails.generalData.apy'
      },
      {
        field:'rewards',
        label:'assets.assetDetails.generalData.rewards'
      },
      {
        field:'performanceFee',
        label:'assets.assetDetails.generalData.performanceFee'
      },
      {
        field:'allocation',
        label:'assets.assetDetails.generalData.allocation'
      }
    ]
  },
  AA:{
    type:'AA',
    color:'#4DE3B0',
    showProtocol: true,
    route:'protected-yield',
    label:'strategies.protected.title',
    description:'strategies.protected.description',
    bg: `${strategiesFolder}protected-yield-bg.png`,
    image: `${strategiesFolder}protected-yield.png`,
    columns: [
      {
        id:'protocol',
        accessor:'id',
        sortType:'alpha'
      },
      {
        id:'asset',
        accessor:'name',
        sortType:'alpha'
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric'
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric'
      },
      {
        id:'rewards',
        accessor:'id'
      }
    ],
    generalDataFields:[
      {
        field: 'protocol',
        label: 'assets.assetDetails.generalData.protocol'
      },
      {
        field:'stakingRewards',
        label:'assets.assetDetails.generalData.stakingRewards'
      },
      {
        field:'autoCompounding',
        label:'assets.assetDetails.generalData.autoCompounding'
      },
      {
        field:'performanceFee',
        label:'assets.assetDetails.generalData.performanceFee'
      },
      {
        field:'status',
        label:'assets.assetDetails.generalData.status'
      },
      {
        field:'pool',
        label:'assets.assetDetails.generalData.pool'
      },
      {
        field:'apy',
        label:'assets.assetDetails.generalData.apy'
      },
      {
        field:'coverage',
        label:'assets.assetDetails.generalData.coverage'
      },
      {
        field:'lastHarvest',
        label:'assets.assetDetails.generalData.lastHarvest'
      },
      {
        field:'apyRatio',
        label:'assets.assetDetails.generalData.apyRatio'
      },
    ]
  },
  BB:{
    type:'BB',
    color:'#6AE4FF',
    showProtocol: true,
    route:'boosted-yield',
    label:'strategies.boosted.title',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
    columns: [
      {
        id:'protocol',
        accessor:'id',
        sortType:'alpha'
      },
      {
        id:'asset',
        accessor:'name',
        sortType:'alpha'
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric'
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric'
      },
      {
        id:'rewards',
        accessor:'id'
      }
    ],
    generalDataFields:[
      {
        field: 'protocol',
        label: 'assets.assetDetails.generalData.protocol'
      },
      {
        field:'stakingRewards',
        label:'assets.assetDetails.generalData.stakingRewards'
      },
      {
        field:'autoCompounding',
        label:'assets.assetDetails.generalData.autoCompounding'
      },
      {
        field:'performanceFee',
        label:'assets.assetDetails.generalData.performanceFee'
      },
      {
        field:'status',
        label:'assets.assetDetails.generalData.status'
      },
      {
        field:'pool',
        label:'assets.assetDetails.generalData.pool'
      },
      {
        field:'apy',
        label:'assets.assetDetails.generalData.apy'
      },
      {
        field:'apyBoost',
        label:'assets.assetDetails.generalData.apyBoost'
      },
      {
        field:'lastHarvest',
        label:'assets.assetDetails.generalData.lastHarvest'
      },
      {
        field:'apyRatio',
        label:'assets.assetDetails.generalData.apyRatio'
      },
    ]
  },
}
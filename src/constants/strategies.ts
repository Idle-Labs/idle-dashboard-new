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
  bg?: string
  type?: string,
  color?: string
  route?: string
  label?: string
  image?: string
  visible: boolean
  description?: string
  columns?: StrategyColumn[]
  generalDataFields: GeneralDataField[]
  carouselItems?: StrategyCarouselItem[]
}

export const strategies: Record<string, StrategyProps> = {
  GG:{
    type:'GG',
    visible: false,
    label:'strategies.gauge.title',
    generalDataFields:[
      {
        field:'weight',
        label:'assets.assetDetails.generalData.weight'
      },
      {
        field:'nextWeight',
        label:'assets.assetDetails.generalData.nextWeight'
      },
      {
        field:'gaugeTotalSupply',
        label:'assets.assetDetails.generalData.totalSupply'
      },
      {
        field:'rewards',
        label:'assets.assetDetails.generalData.gaugeRewards'
      }
    ],
    carouselItems: [
      {
        image:`${strategiesCarouselFolder}AA-gauges.gif`,
        title:'strategies.best.carousel.gauges.title',
        description:'strategies.best.carousel.gauges.description'
      }
    ]
  },
  BY:{
    type:'BY',
    visible: true,
    color:'#FFD15C',
    route:'best-yield',
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
    visible: true,
    color:'#4DE3B0',
    route:'protected-yield',
    label:'strategies.protected.title',
    description:'strategies.protected.description',
    bg: `${strategiesFolder}protected-yield-bg.png`,
    image: `${strategiesFolder}protected-yield.png`,
    carouselItems: [
      {
        image:`${strategiesCarouselFolder}AA-pooled-funds.gif`,
        title:'strategies.best.carousel.pooledDeposits.title',
        description:'strategies.best.carousel.pooledDeposits.description'
      },
      {
        image:`${strategiesCarouselFolder}AA-deposits-protection.gif`,
        title:'strategies.best.carousel.depositsProtection.title',
        description:'strategies.best.carousel.depositsProtection.description'
      },
      {
        image:`${strategiesCarouselFolder}AA-gauges.gif`,
        title:'strategies.best.carousel.gauges.title',
        description:'strategies.best.carousel.gauges.description'
      },
      {
        image:`${strategiesCarouselFolder}AA-default-management.gif`,
        title:'strategies.best.carousel.defaultManagement.title',
        description:'strategies.best.carousel.defaultManagement.description'
      }
    ],
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
    visible: true,
    color:'#6AE4FF',
    route:'boosted-yield',
    label:'strategies.boosted.title',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
    carouselItems: [
      {
        image:`${strategiesCarouselFolder}BB-pooled-funds.gif`,
        title:'strategies.best.carousel.pooledDeposits.title',
        description:'strategies.best.carousel.pooledDeposits.description'
      },
      {
        image:`${strategiesCarouselFolder}BB-boosted-yield.gif`,
        title:'strategies.best.carousel.boostedYield.title',
        description:'strategies.best.carousel.boostedYield.description'
      },
      {
        image:`${strategiesCarouselFolder}BB-default-management.gif`,
        title:'strategies.best.carousel.defaultManagement.title',
        description:'strategies.best.carousel.defaultManagement.description'
      }
    ],
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
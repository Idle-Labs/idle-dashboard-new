import { strategiesCarouselFolder, strategiesFolder } from 'constants/folders'

export type GeneralDataField = {
  field: string
  label: string
  tooltip?: string
}

export type StrategyCarouselItem = {
  image: string
  title: string
  description: string
}

type Tables = "Available" | "Deposited"

export type StrategyColumn = {
  id?: any
  title?: any
  accessor: any
  tables?: Tables[]
  sortType?: 'alpha' | 'numeric'
}

export type DynamicActionFields = Record<string, string[]>

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
  dynamicActionFields?: DynamicActionFields
}

export const strategies: Record<string, StrategyProps> = {
  GG:{
    type:'GG',
    visible: false,
    label:'strategies.gauge.title',
    generalDataFields:[
      {
        field:'weight',
        tooltip:'assets.assetDetails.tooltips.weight',
        label:'assets.assetDetails.generalData.weight'
      },
      {
        field:'nextWeight',
        tooltip:'assets.assetDetails.tooltips.nextWeight',
        label:'assets.assetDetails.generalData.nextWeight'
      },
      {
        field:'gaugeTotalSupply',
        tooltip:'assets.assetDetails.tooltips.totalSupply',
        label:'assets.assetDetails.generalData.totalSupply'
      },
      {
        field:'rewards',
        tooltip:'assets.assetDetails.tooltips.gaugeRewards',
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
    color:'#6AE4FF',
    route:'best-yield',
    label:'strategies.best.title',
    description:'strategies.best.description',
    image: `${strategiesFolder}best-yield.png`,
    bg: `${strategiesFolder}best-yield-bg.svg`,
    dynamicActionFields:{
      // deposit:['coverage' ,'newApy'],
      withdraw:['gain', 'fee', 'netGain']
    },
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
        id:'apy7',
        accessor:'apy7',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        id:'apy30',
        accessor:'apy30',
        sortType: 'numeric',
        tables: ['Available']
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
        label:'assets.assetDetails.generalData.apy',
        tooltip:'assets.assetDetails.tooltips.spotApy'
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
    dynamicActionFields:{
      deposit:['coverage' ,'newApy'],
      withdraw:['gain', 'fee', 'netGain']
    },
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
        id:'apy7',
        accessor:'apy7',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        id:'apy30',
        accessor:'apy30',
        sortType: 'numeric',
        tables: ['Available']
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
        tooltip:'assets.assetDetails.tooltips.gaugeRewards',
        label:'assets.assetDetails.generalData.stakingRewards'
      },
      {
        field:'autoCompounding',
        tooltip:'assets.assetDetails.tooltips.autoCompounding',
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
        label:'assets.assetDetails.generalData.apy',
        tooltip:'assets.assetDetails.tooltips.seniorTrancheApy'
      },
      {
        field:'coverage',
        tooltip:'assets.assetDetails.tooltips.coverage',
        label:'assets.assetDetails.generalData.coverage'
      },
      {
        field:'lastHarvest',
        tooltip:'assets.assetDetails.tooltips.lastHarvest',
        label:'assets.assetDetails.generalData.lastHarvest'
      },
      {
        field:'apyRatio',
        tooltip:'assets.assetDetails.tooltips.apyRatio',
        label:'assets.assetDetails.generalData.apyRatio'
      },
    ]
  },
  BB:{
    type:'BB',
    visible: true,
    color:'#FFD15C',
    route:'boosted-yield',
    label:'strategies.boosted.title',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
    dynamicActionFields:{
      deposit:['boost', 'overperformance', 'newApy'],
      withdraw:['gain', 'fee', 'netGain']
    },
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
        id:'apy7',
        accessor:'apy7',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        id:'apy30',
        accessor:'apy30',
        sortType: 'numeric',
        tables: ['Available']
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
        tooltip:'assets.assetDetails.tooltips.autoCompounding',
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
        label:'assets.assetDetails.generalData.apy',
        tooltip:'assets.assetDetails.tooltips.juniorTrancheApy'
      },
      {
        field:'apyBoost',
        label:'assets.assetDetails.generalData.apyBoost',
        tooltip:'assets.assetDetails.tooltips.apyBoost',
      },
      {
        field:'lastHarvest',
        label:'assets.assetDetails.generalData.lastHarvest',
        tooltip:'assets.assetDetails.tooltips.lastHarvest',
      },
      {
        field:'apyRatio',
        tooltip:'assets.assetDetails.tooltips.apyRatio',
        label:'assets.assetDetails.generalData.apyRatio'
      },
    ]
  },
}
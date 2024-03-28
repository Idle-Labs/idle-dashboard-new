import { StackProps } from '@chakra-ui/react'
import type { BannerProps } from 'constants/types'
import { strategiesCarouselFolder, strategiesFolder } from 'constants/folders'

export type GeneralDataField = {
  props?: any
  field: string
  label: string
  tooltip?: string
  inlineField?: string
}

export type StrategyCarouselItem = {
  image: string
  title: string
  description: string
}

export type Tables = "Available" | "Deposited" | "Discount"

export type StrategyColumn = {
  id?: any
  title?: any
  width?: any
  accessor: any
  cellSx?: any
  tables?: Tables[]
  extraFields?: string[]
  stackProps?: StackProps
  fieldProps?: any
  sortType?: string
}

type StatsProps = {
  header: Record<string, any>
  strategyData?: Record<string, any>
}

export type DynamicActionFields = Record<string, string[]>

export type StrategyProps = {
  bg?: string
  type?: string,
  color?: string
  route?: string
  label?: string
  title?: string
  image?: string
  visible: boolean
  strategy?: string,
  stats?: StatsProps
  features?: string[]
  banner?: BannerProps
  riskProfile?: string
  description?: string
  feesCollectors?: string[]
  columns?: StrategyColumn[]
  generalDataFields: GeneralDataField[]
  carouselItems?: StrategyCarouselItem[]
  dynamicActionFields?: DynamicActionFields
}

export const strategies: Record<string, StrategyProps> = {
  STK:{
    type:'STK',
    visible: false,
    label:'strategies.staking.title',
    generalDataFields:[
      {
        field:'stakingTvl',
        label:'assets.assetDetails.generalData.totalIDLELocked',
        tooltip:'assets.assetDetails.tooltips.totalIDLELocked'
      },
      {
        field:'stkIDLESupply',
        label:'assets.assetDetails.generalData.totalStkIDLESupply',
        tooltip:'assets.assetDetails.tooltips.stkIDLESupply'
      },
      {
        field:'totalDiscountedFees',
        label:'assets.assetDetails.generalData.totalDiscountedFees',
        tooltip:'assets.assetDetails.tooltips.totalDiscountedFees'
      },
      {
        field:'stakingAvgLockTimeChart',
        inlineField:'stakingAvgLockTime',
        label:'assets.assetDetails.generalData.avgLockTime',
        tooltip:'assets.assetDetails.tooltips.stakingAvgLockTime',
      }
    ],
    dynamicActionFields:{
      stake:['stkIDLE', 'feeDiscount'],
      increaseTime:['stkIDLEAfterIncrease', 'feeDiscount'],
      increaseAmount:['stkIDLEAfterIncrease', 'feeDiscount']
    },
  },
  GG:{
    type:'GG',
    visible: false,
    label:'strategies.gauge.title',
    generalDataFields:[
      {
        field:'gaugeTotalSupply',
        tooltip:'assets.assetDetails.tooltips.totalSupply',
        label:'assets.assetDetails.generalData.totalSupply'
      },
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
    strategy:'best',
    route:'best-yield',
    title:'strategies.best.title',
    label:'strategies.best.label',
    /*
    banner:{
      text:'strategies.best.banner.text',
      cta:'strategies.best.banner.cta',
      modal:{
        cta:'strategies.best.modal.cta',
        text:'strategies.best.modal.text',
        title:'strategies.best.modal.title',
        subtitle:'strategies.best.modal.subtitle'
      }
    },
    */
    feesCollectors:[
      "0xbecc659bfc6edca552fa1a67451cc6b38a0108e4",
      "0xfb3bd022d5dacf95ee28a6b07825d4ff9c5b3814",
      "0x69a62c24f16d4914a48919613e8ee330641bcb94"
    ],
    description:'strategies.best.description',
    bg: `${strategiesFolder}best-yield-bg.svg`,
    image: `${strategiesFolder}best-yield.png`,
    dynamicActionFields:{
      // deposit:['coverage' ,'newApy'],
      withdraw:['totalGain', 'fee', 'netGain']
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
    stats:{
      header:{
        fields:['protocols']
      }
    },
    columns: [
      {
        accessor:'name',
        sortType:'alpha',
        title:'defi.asset',
        id:'assetWithStatus',
        extraFields:['strategies'],
        stackProps:{
          justifyContent:'space-between'
        },
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric'
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric',
        extraFields:['idleDistribution'],
        stackProps:{
          direction:'column',
          alignItems:'flex-start',
          justifyContent:'flex-start'
        },
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
        field:'idleDistribution',
        props:{
          size:'xs',
          fontSize:'md',
          defaultText:'-'
        },
        label:'assets.assetDetails.generalData.idleDistribution',
        tooltip:'assets.assetDetails.tooltips.idleDistribution'
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
    strategy:'tranches',
    route:'yield-tranches',
    label:'strategies.protected.title',
    riskProfile:'strategies.protected.riskProfile',
    description:'strategies.protected.description',
    bg: `${strategiesFolder}protected-yield-bg.png`,
    image: `${strategiesFolder}protected-yield.png`,
    dynamicActionFields:{
      deposit:['coverage' ,'newApy'],
      withdraw:['withdrawFee', 'totalGain', 'fee', 'netGain']
    },
    feesCollectors:[
      "0xfb3bd022d5dacf95ee28a6b07825d4ff9c5b3814",
    ],
    features:[
      "strategies.protected.features.builtInProtection",
      "strategies.protected.features.minimumYield",
      "strategies.protected.features.compoundedRewards"
    ],
    stats:{
      header:{
        fields:['protocolWithVariant']
      },
      strategyData:{
        fields:['coveragePercentage']
      }
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
        image:`${strategiesCarouselFolder}AA-default-management.gif`,
        title:'strategies.best.carousel.defaultManagement.title',
        description:'strategies.best.carousel.defaultManagement.description'
      }
    ],
    columns: [
      {
        accessor:'id',
        sortType:'alpha',
        id:'protocolWithVariant',
        extraFields:['statusBadge', 'actionRequired']
      },
      {
        id:'asset',
        accessor:'name',
        sortType:'alpha',
        // extraFields:[]
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric'
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric',
        extraFields:['rewardsEmissions'],
        stackProps:{
          direction:'column',
          alignItems:'flex-start',
          justifyContent:'flex-start'
        }
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
        field: 'protocolWithVariant',
        props: {
          size:'xs'
        },
        label: 'assets.assetDetails.generalData.protocol'
      },
      // {
      //   field:'stakingRewards',
      //   tooltip:'assets.assetDetails.tooltips.gaugeRewards',
      //   label:'assets.assetDetails.generalData.stakingRewards'
      // },
      {
        field:'strategies',
        props:{
          iconMargin: 0,
          showLabel: true
        },
        label:'assets.assetDetails.generalData.riskProfile',
      },
      {
        field:'pool',
        label:'assets.assetDetails.generalData.pool'
      },
      {
        field:'apyWithRewards',
        label:'assets.assetDetails.generalData.apy',
        tooltip:'assets.assetDetails.tooltips.seniorTrancheApy'
      },
      {
        field:'status',
        label:'assets.assetDetails.generalData.status',
        tooltip:'assets.assetDetails.tooltips.vaultStatus'
      },
      {
        field:'performanceFee',
        label:'assets.assetDetails.generalData.performanceFee'
      },
      {
        field:'coverage',
        tooltip:'assets.assetDetails.tooltips.coverage',
        label:'assets.assetDetails.generalData.coverage'
      },
      {
        field:'autoCompounding',
        tooltip:'assets.assetDetails.tooltips.autoCompounding',
        label:'assets.assetDetails.generalData.autoCompounding'
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
    strategy:'tranches',
    route:'yield-tranches',
    label:'strategies.boosted.title',
    riskProfile:'strategies.boosted.riskProfile',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
    dynamicActionFields:{
      deposit:['boost', 'overperformance', 'newApy'],
      withdraw:['withdrawFee', 'totalGain', 'fee', 'netGain']
    },
    feesCollectors:[
      "0xfb3bd022d5dacf95ee28a6b07825d4ff9c5b3814",
    ],
    features:[
      "strategies.boosted.features.higherYield",
      "strategies.boosted.features.outperformUnderlying",
      "strategies.boosted.features.compoundedRewards"
    ],
    stats:{
      header:{
        fields:['protocolWithVariant']
      },
      strategyData:{
        fields:['apyBoost']
      }
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
        accessor:'id',
        sortType:'alpha',
        id:'protocolWithVariant',
        extraFields:['statusBadge']
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
        sortType: 'numeric',
        extraFields:['rewardsEmissions'],
        stackProps:{
          direction:'column',
          alignItems:'flex-start',
          justifyContent:'flex-start'
        }
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
        field: 'protocolWithVariant',
        props: {
          size:'xs'
        },
        label: 'assets.assetDetails.generalData.protocol'
      },
      // {
      //   field:'stakingRewards',
      //   label:'assets.assetDetails.generalData.stakingRewards'
      // },
      {
        field:'strategies',
        props:{
          iconMargin: 0,
          showLabel: true
        },
        label:'assets.assetDetails.generalData.riskProfile',
      },
      {
        field:'pool',
        label:'assets.assetDetails.generalData.pool'
      },
      {
        field:'apyWithRewards',
        label:'assets.assetDetails.generalData.apy',
        tooltip:'assets.assetDetails.tooltips.juniorTrancheApy'
      },
      {
        field:'status',
        label:'assets.assetDetails.generalData.status',
        tooltip:'assets.assetDetails.tooltips.vaultStatus'
      },
      {
        field:'performanceFee',
        label:'assets.assetDetails.generalData.performanceFee'
      },
      {
        field:'apyBoost',
        label:'assets.assetDetails.generalData.apyBoost',
        tooltip:'assets.assetDetails.tooltips.apyBoost',
      },
      {
        field:'autoCompounding',
        tooltip:'assets.assetDetails.tooltips.autoCompounding',
        label:'assets.assetDetails.generalData.autoCompounding'
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
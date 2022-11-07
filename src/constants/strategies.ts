import { strategiesFolder } from 'constants/folders'

export type GeneralDataField = {
  field: string
  label: string
}

export type StrategyProps = {
  bg: string
  route: string
  label: string
  image: string
  description: string
  showProtocol: boolean
  generalDataFields: GeneralDataField[]
}

export const strategies: Record<string, StrategyProps> = {
  BY:{
    route:'best-yield',
    showProtocol: false,
    label:'strategies.best.title',
    description:'strategies.best.description',
    image: `${strategiesFolder}best-yield.png`,
    bg: `${strategiesFolder}best-yield-bg.svg`,
    generalDataFields:[
      {
        field: 'protocol',
        label: 'assets.assetDetails.generalData.protocol'
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
        field:'rewards',
        label:'assets.assetDetails.generalData.rewards'
      },
      {
        field:'allocation',
        label:'assets.assetDetails.generalData.allocation'
      }
    ]
  },
  AA:{
    showProtocol: true,
    route:'protected-yield',
    label:'strategies.protected.title',
    description:'strategies.protected.description',
    bg: `${strategiesFolder}protected-yield-bg.png`,
    image: `${strategiesFolder}protected-yield.png`,
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
    showProtocol: true,
    route:'boosted-yield',
    label:'strategies.boosted.title',
    description:'strategies.boosted.description',
    image: `${strategiesFolder}boosted-yield.png`,
    bg: `${strategiesFolder}boosted-yield-bg.png`,
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
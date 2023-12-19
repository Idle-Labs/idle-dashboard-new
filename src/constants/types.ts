import React from 'react'
import * as moment from 'moment'
import type { Vault } from 'vaults/'
import type { AbiItem } from 'web3-utils'
import type { BigNumber } from 'bignumber.js'
import { IconType as ReactIcon } from 'react-icons'
import { ContractSendMethod } from 'web3-eth-contract'

export type { Vault } from 'vaults/'
export type { BigNumber } from 'bignumber.js'

export type Abi = AbiItem[]

export type IconType = string | ReactIcon | React.ElementType

export type NumberType = string | number | BigNumber

export type Address = `${'0x'}${string & { length: 40 }}`

export type VaultAdditionalApr = {
  vaultId: string
  apr: BigNumber
  cdoId?: string
  type?: string
}

export interface ErrnoException extends Error {
  errno?: number;
  code?: number;
  path?: string;
  syscall?: string;
  stack?: string;
}

export type ReducerActionTypes = {
  type: string,
  payload: any
}

export type HistoryData = {
  value: number
  date: number
}

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type VaultHistoricalTvls = {
  vaultId: string
  tvls: HistoryData[]
}

export type VaultHistoricalRates = {
  vaultId: string
  rates: HistoryData[]
}

export type VaultHistoricalPrices = {
  vaultId: string
  prices: HistoryData[]
}

export type VaultHistoricalData = {
  vaultId: string
  tvls: HistoryData[]
  rates: HistoryData[]
  prices: HistoryData[]
}

export type ChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

export type PlatformApiFilters = Record<string, string | number>

export type DateRange = {
  startDate: moment.Moment | null
  endDate: moment.Moment | null
}

export enum HistoryTimeframe {
  // HOUR = "1H",
  // DAY = "24H",
  WEEK = "1W",
  MONTH = "1M",
  "6MONTHS" = "6M",
  YEAR = "1Y",
  ALL = "ALL"
}

export enum TransactionSpeed {
  VeryFast = 'veryFast',
  Fast = 'fast',
  Average = 'average',
  Slow = 'slow'
}

export type EtherscanTransaction = {
  blockHash: string
  blockNumber: string
  confirmations: string
  contractAddress: Address
  cumulativeGasUsed: string
  from: string
  gas: string
  gasPrice: string
  gasUsed: string
  hash: string
  input: string
  nonce: string
  timeStamp: string
  to: string
  tokenDecimal: string
  tokenName: string
  tokenSymbol: string
  transactionIndex: string
  value: string
}

export type AssetId = string
export type Balances = Record<AssetId, BigNumber>

export type VaultRewards = {
  assets: AssetId[]
  amount: BigNumber
}

export type MaticNFT = {
  amount: BigNumber
  currentEpoch: number
  remainingEpochs: number
  remainingTime: number
  requestEpoch: number
  status: string
  tokenId: string
  unlockTimestamp: number
  contractSendMethod: ContractSendMethod
}

export type VaultsRewards = Record<AssetId, VaultRewards>

export type Transaction = {
  action: string
  subAction?: string
  chainId?: number
  assetId: AssetId
  idlePrice: BigNumber
  idleAmount: BigNumber
  amountUsd?: BigNumber
  underlyingAmount: BigNumber
} & EtherscanTransaction

// export type GaugeReward = {
//   apy: BigNumber
//   assetId: AssetId
//   distributionRate: BigNumber
// }

export type GaugeRewardData = {
  balance: BigNumber | null
  rate: BigNumber | null
  apr: NumberType | null
}
export type GaugeRewards = Record<AssetId, GaugeRewardData>

export type GaugesReward = {
  gauges: AssetId[]
  deposited: BigNumber
} & GaugeRewardData

export type GaugesRewards = Record<AssetId, GaugesReward>

export type GaugeData = {
  weight: BigNumber
  rewards: GaugeRewards
  nextWeight: BigNumber
  totalSupply: BigNumber
  gaugePoolUsd: BigNumber
  distributionRate: BigNumber
}

export type GaugesData = Record<AssetId, GaugeData>

export type EpochWeekThreshold = {
  number: number
  start: number
  end: number
  threshold: BigNumber
}

export type EpochData = {
  cdoId?: string
  apr: BigNumber
  number: number
  start: number
  end: number
  underlyingToken: string
  riskThreshold: BigNumber
  weeklyThresholds: Record<number, EpochWeekThreshold>
}

export type StakingData = {
  maxApr: BigNumber
  rewardsDays: number
  avgLockTime: number
  feeDiscount: BigNumber
  totalDiscountedFees: BigNumber
  rewards: EtherscanTransaction[]
  position: {
    lockEnd: number
    share: BigNumber
    balance: BigNumber
    deposited: BigNumber
    claimable: BigNumber
  },
  IDLE: {
    asset: Asset | null | undefined,
    totalRewards: BigNumber
    totalSupply: BigNumber
  }
  stkIDLE: {
    asset: Asset | null | undefined,
    totalSupply: BigNumber
  }
}

export type VaultPosition = {
  poolShare: BigNumber
  avgBuyPrice: BigNumber
  realizedApy: BigNumber
  depositDuration: number
  rewardsApy?: BigNumber
  earningsPercentage: BigNumber
  firstDepositTx?: Transaction | null
  idle: {
    staked: BigNumber
    earnings: BigNumber
    deposited: BigNumber
    redeemable: BigNumber
  },
  underlying: {
    staked: BigNumber
    earnings: BigNumber
    deposited: BigNumber
    redeemable: BigNumber
    discountedFees?: BigNumber
  },
  usd: {
    staked: BigNumber
    earnings: BigNumber
    rewards?: BigNumber
    deposited: BigNumber
    redeemable: BigNumber
    discountedFees?: BigNumber
  }
}

export type Harvest = {
  hash: string
  aprs: Balances
  value: Balances
  timestamp: number
  blockNumber: number
  tokenAddress: Address
  totalValue: BigNumber
}

export type VaultStatus = 'production' | 'beta' | 'experimental' | 'deprecated' | 'maintenance' | 'paused' | 'boosted' | 'discount'

export type ModalProps = {
  title?: string
  subtitle?: string
  text?: string
  cta?: string
  body?: JSX.Element | null
}

export type BannerProps = {
  text: string
  cta?: string
  modal?: ModalProps
}

export type DistributedReward = {
  hash: string
  assetId: AssetId
  chainId?: number
  timeStamp: number
  blockNumber: number
  apr: BigNumber | null
  value: BigNumber
  tx: EtherscanTransaction
}

export type Asset = {
  id?: AssetId
  name: string
  icon?: string
  type?: string
  token: string
  color?: string
  apr?: BigNumber
  apy?: BigNumber
  fee?: BigNumber
  tvl?: BigNumber
  vaultId?: string
  chainId?: number
  decimals: number
  variant?: string
  apy7?: BigNumber
  limit?: BigNumber
  apy30?: BigNumber
  protocol?: string
  tvlUsd?: BigNumber
  rewards?: Balances
  balance?: BigNumber
  baseApr?: BigNumber
  status?: VaultStatus
  totalTvl?: BigNumber
  aprRatio?: BigNumber
  apyBoost?: BigNumber
  priceUsd?: BigNumber
  totalApr?: BigNumber
  gaugeData?: GaugeData
  vaultIsOpen?: boolean
  rates?: HistoryData[]
  prices?: HistoryData[]
  balanceUsd?: BigNumber
  vaultPrice?: BigNumber
  allocations?: Balances
  underlyingId?: AssetId
  totalSupply?: BigNumber
  aprBreakdown?: Balances
  apyBreakdown?: Balances
  protocolsAprs?: Balances
  pricesUsd?: HistoryData[]
  additionalApr?: BigNumber
  epochData?: EpochData | null
  lastHarvest?: Harvest | null
  idleDistribution?: BigNumber
  collectedFees?: Transaction[]
  vaultPosition?: VaultPosition
  flags?: Record<string, boolean>
  interestBearingTokens?: Balances
  discountedFees?: DistributedReward[]
  distributedRewards?: Record<AssetId, DistributedReward[]>
}

export type Assets = Record<AssetId, Asset>
export type Vaults = Record<AssetId, Vault>

export type VaultBalance = {
  vault: string
  balance: BigNumber
}

export type Paragraph = {
  title?: string
  description?: string
}

export type Avatar = {
  url: string;
  linkage: Array<{
    type: string;
    content: string;
  }>;
};

export type Ens = {
  name: string
  avatar: Avatar | null
  contentHash: string | null
  getText: (key: string) => Promise<string | undefined>
}

export type Account = {
  address: string
  ens: Ens | null
  balance: Record<string, string> | null
}

export type ContractRawCall = {
  assetId: AssetId
  data?: any
  call: ContractSendMethod
  decimals?: number
}
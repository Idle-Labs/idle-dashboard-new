import React from 'react'
import type { Vault } from 'vaults/'
import type { AbiItem } from 'web3-utils'
import type { BigNumber } from 'bignumber.js'
import { IconType as ReactIcon } from 'react-icons'
import { ContractSendMethod } from 'web3-eth-contract'

export type { Vault } from 'vaults/'
export type { BigNumber } from 'bignumber.js'

export type Abi = AbiItem[]

export type IconType = string | ReactIcon | React.ElementType

export type Number = string | number | BigNumber

export type VaultAdditionalApr = {
  vaultId: string
  apr: BigNumber
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
  rates: HistoryData[]
  prices: HistoryData[]
}

export type HistoryData = {
  value: number
  date: number
}

export type PlatformApiFilters = Record<string, string | number>

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
  contractAddress: string
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
export type Balances = Record<string, BigNumber>

export type Transaction = EtherscanTransaction & {
  action: string,
  assetId: AssetId
  idleAmount: BigNumber
  idlePrice: BigNumber
  underlyingAmount: BigNumber
}

export type VaultPosition = {
  avgBuyPrice: BigNumber
  depositDuration: number
  earningsPercentage: BigNumber
  firstDepositTx?: Transaction | null
  underlying: {
    staked: BigNumber
    earnings: BigNumber
    deposited: BigNumber
    redeemable: BigNumber
  },
  usd: {
    staked: BigNumber
    earnings: BigNumber
    deposited: BigNumber
    redeemable: BigNumber
  }
}

export type Harvest ={
  aprs: Balances
  value: Balances
  timestamp: number
  blockNumber: number
  tokenAddress: string
}

export type Asset = {
  id?: AssetId
  icon?: string
  vaultId?: string
  type?: string
  name: string
  token: string
  decimals: number
  color?: string
  status?: string
  lastHarvest?: Harvest | null
  underlyingId?: AssetId
  apr?: BigNumber
  apy?: BigNumber
  fee?: BigNumber
  balance?: BigNumber
  aprRatio?: BigNumber
  baseApr?: BigNumber
  apyBoost?: BigNumber
  priceUsd?: BigNumber
  balanceUsd?: BigNumber
  vaultPrice?: BigNumber
  totalSupply?: BigNumber
  tvl?: BigNumber
  tvlUsd?: BigNumber
  rates?: HistoryData[]
  prices?: HistoryData[]
  pricesUsd?: HistoryData[]
  allocations?: Balances
  vaultPosition?: VaultPosition
}

export type Assets = Record<string, Asset>
export type Vaults = Record<string, Vault>

export type VaultBalance = {
  vault: string
  balance: BigNumber
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
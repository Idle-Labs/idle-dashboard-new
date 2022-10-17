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

export type Transaction = EtherscanTransaction & {
  action: string,
  assetId: string
  idleAmount: BigNumber
  idlePrice: BigNumber
  underlyingAmount: BigNumber
}

export type VaultPosition = {
  avgBuyPrice: BigNumber
  earningsAmount: BigNumber
  depositedAmount: BigNumber
  redeemableAmount: BigNumber
  earningsPercentage: BigNumber
}

export type Asset = {
  id?: string
  icon?: string
  vaultId?: string
  type?: string
  name: string
  token: string
  decimals: number
  apr?: BigNumber
  balance?: BigNumber
  balanceUsd?: BigNumber
  priceUsd?: BigNumber
  vaultPrice?: BigNumber
  totalSupply?: BigNumber
  tvl?: BigNumber
  tvlUsd?: BigNumber
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
  name: string;
  avatar: Avatar | null;
  contentHash: string | null;
  getText: (key: string) => Promise<string | undefined>;
}

export type Balances = Record<string, BigNumber>;

export type Account = {
  address: string;
  ens: Ens | null;
  balance: Record<string, string> | null;
}

export type ContractRawCall = {
  assetId: string
  call: ContractSendMethod
  decimals?: number
}
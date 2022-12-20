import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { GaugeVault } from 'vaults/GaugeVault'
import useLocalForge from 'hooks/useLocalForge'
import { useWeb3Provider } from './Web3Provider'
import { TrancheVault } from 'vaults/TrancheVault'
import { selectUnderlyingToken } from 'selectors/'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { StakedIdleVault } from 'vaults/StakedIdleVault'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { useCacheProvider } from 'contexts/CacheProvider'
import { GenericContract } from 'contracts/GenericContract'
import { historicalPricesUsd } from 'constants/historicalData'
import type { CallData, DecodedResult } from 'classes/Multicall'
import type { CdoLastHarvest } from 'classes/VaultFunctionsHelper'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import React, { useContext, useEffect, useMemo, useCallback, useReducer } from 'react'
import { VaultFunctionsHelper, ChainlinkHelper, FeedRoundBounds, GenericContractsHelper } from 'classes/'
import type { GaugeRewardData, GenericContractConfig, UnderlyingTokenProps, ContractRawCall } from 'constants/'
import { BNify, makeEtherscanApiRequest, apr2apy, isEmpty, dayDiff, fixTokenDecimals, asyncReduce } from 'helpers/'
import { globalContracts, GaugeData, bestYield, tranches, gauges, underlyingTokens, defaultChainId, EtherscanTransaction, PROTOCOL_TOKEN } from 'constants/'
import type { ReducerActionTypes, VaultsRewards, Balances, StakingData, Asset, AssetId, Assets, Vault, Transaction, VaultPosition, VaultAdditionalApr, VaultHistoricalData, HistoryData, GaugeRewards, GaugesRewards, GaugesData, MaticNFT } from 'constants/types'

type VaultsOnchainData = {
  fees: Balances
  aprs: Balances
  baseAprs: Balances
  balances: Balances
  aprRatios: Balances
  pricesUsd: Balances
  maticNFTs: MaticNFT[]
  gaugesData: GaugesData
  vaultsPrices: Balances
  totalSupplies: Balances
  additionalAprs: Balances
  vaultsRewards: VaultsRewards
  stakingData: StakingData | null
  rewards: Record<AssetId, Balances>
  allocations: Record<AssetId, Balances>
  aprsBreakdown: Record<AssetId, Balances>
  lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>
}

type InitialState = {
  vaults: Vault[]
  assetsData: Assets
  balancesUsd: Balances
  helpers: Record<any, any>
  isPortfolioLoaded: boolean
  protocolToken: Asset | null
  transactions: Transaction[]
  contracts: GenericContract[]
  gaugesRewards: GaugesRewards
  isVaultsPositionsLoaded: boolean
  portfolioTimestamp: number | null
  selectors: Record<string, Function>
  vaultsPositions: Record<string, VaultPosition>
  historicalRates: Record<AssetId, HistoryData[]>
  historicalPrices: Record<AssetId, HistoryData[]>
  historicalPricesUsd: Record<AssetId, HistoryData[]>
} & VaultsOnchainData

type ContextProps = InitialState

const initialState: InitialState = {
  fees: {},
  aprs: {},
  vaults: [],
  helpers: {},
  rewards: {},
  balances: {},
  baseAprs: {},
  aprRatios: {},
  selectors: {},
  contracts: [],
  maticNFTs: [],
  pricesUsd: {},
  gaugesData: {},
  assetsData: {},
  allocations: {},
  balancesUsd: {},
  lastHarvests: {},
  vaultsPrices: {},
  transactions: [],
  stakingData: null,
  totalSupplies: {},
  vaultsRewards: {},
  gaugesRewards: {},
  aprsBreakdown: {},
  additionalAprs: {},
  protocolToken: null,
  vaultsPositions: {},
  historicalRates: {},
  historicalPrices: {},
  historicalPricesUsd: {},
  isPortfolioLoaded: false,
  portfolioTimestamp: null,
  isVaultsPositionsLoaded: false,
}

const initialContextState = initialState

const reducer = (state: InitialState, action: ReducerActionTypes) => {

  // console.log(action.type, action.payload)

  switch (action.type){
    case 'RESET_STATE':
      return {...initialState}
    case 'SET_PROTOCOL_TOKEN':
      return {...state, protocolToken: action.payload}
    case 'SET_PORTFOLIO_TIMESTAMP':
      return {...state, portfolioTimestamp: action.payload}
    case 'SET_PORTFOLIO_LOADED':
      return {...state, isPortfolioLoaded: action.payload, portfolioTimestamp: Date.now()}
    case 'SET_VAULTS_POSITIONS_LOADED':
      return {...state, isVaultsPositionsLoaded: action.payload}
    case 'SET_SELECTORS':
      return {...state, selectors: action.payload}
    case 'SET_HELPERS':
      return {...state, helpers: action.payload}
    case 'SET_CONTRACTS':
      return {...state, contracts: action.payload}
    case 'SET_VAULTS_TRANSACTIONS':
      return {...state, transactions: action.payload}
    case 'SET_VAULTS_POSITIONS':
      return {...state, vaultsPositions: action.payload}  
    case 'SET_VAULTS':
      return {...state, vaults: action.payload}
    case 'SET_APRS':
      return {...state, aprs: action.payload}
    case 'SET_STAKING_DATA':
      return {...state, stakingData: action.payload}  
    case 'SET_FEES':
      return {...state, fees: action.payload}
    case 'SET_BASE_APRS':
      return {...state, baseAprs: action.payload}
    case 'SET_APR_RATIOS':
      return {...state, aprRatios: action.payload}
    case 'SET_ALLOCATIONS':
      return {...state, allocations: action.payload}
    case 'SET_LAST_HARVESTS':
      return {...state, lastHarvests: action.payload}
    case 'SET_HISTORICAL_RATES':
      return {...state, historicalRates: action.payload}
    case 'SET_ADDITIONAL_APRS':
      return {...state, additionalAprs: action.payload}
    case 'SET_HISTORICAL_PRICES':
      return {...state, historicalPrices: action.payload}
    case 'SET_HISTORICAL_PRICES_USD':
      return {...state, historicalPricesUsd: action.payload}
    case 'SET_BALANCES':
      return {...state, balances: action.payload}
    case 'SET_MATIC_NTFS':
      return {...state, maticNFTs: action.payload}  
    case 'SET_GAUGES_DATA':
      return {...state, gaugesData: action.payload}
    case 'SET_REWARDS':
      return {...state, rewards: action.payload}
    case 'SET_VAULTS_REWARDS':
      return {...state, vaultsRewards: action.payload}
    case 'SET_GAUGES_REWARDS':
      return {...state, gaugesRewards: action.payload}
    case 'SET_BALANCES_USD':
      return {...state, balancesUsd: action.payload}
    case 'SET_VAULTS_PRICES':
      return {...state, vaultsPrices: action.payload}
    case 'SET_PRICES_USD':
      return {...state, pricesUsd: action.payload}
    case 'SET_TOTAL_SUPPLIES':
      return {...state, totalSupplies: action.payload}  
    case 'SET_APRS_BREAKDOWN':
      return {...state, aprsBreakdown: action.payload}  
    case 'SET_ASSETS_DATA':
      return {...state, assetsData: action.payload}
    case 'SET_ASSETS_DATA_IF_EMPTY':
      if (isEmpty(state.assetsData)) {
        return {...state, assetsData: action.payload}
      } else {
        return state
      }
    case 'SET_ASSET_DATA':
      return {
        ...state,
        assetsData: {
          ...state.assetsData,
          [action.payload.assetId.toLowerCase()]:{
            ...state.assetsData[action.payload.assetId.toLowerCase()],
            ...action.payload.assetData
          }
        }
      }
    default:
      return state
  }
}

const PortfolioProviderContext = React.createContext<ContextProps>(initialContextState)

export const usePortfolioProvider = () => useContext(PortfolioProviderContext)

export function PortfolioProvider({ children }:ProviderProps) {
  const cacheProvider = useCacheProvider()
  const { web3, web3Rpc, multiCall } = useWeb3Provider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { state: { lastTransaction } } = useTransactionManager()
  const { walletInitialized, connecting, account, chainId, explorer } = useWalletProvider()
  const [ storedHistoricalPricesUsd, setHistoricalPricesUsd, , storedHistoricalPricesUsdLoaded ] = useLocalForge('historicalPricesUsd', historicalPricesUsd)

  const generateAssetsData = (vaults: Vault[]) => {
    const assetData = vaults.reduce( (assets: Assets, vault: Vault) => {
      const vaultAssetsData = vault.getAssetsData()

      // Add assets IDs
      const vaultAssetsDataWithIds = Object.keys(vaultAssetsData).reduce( (vaultAssetsDataWithIds: Assets, assetId: AssetId) => {
        vaultAssetsDataWithIds[assetId] = {
          id: assetId,
          ...vaultAssetsData[assetId],
          status: 'production'
        }
        return vaultAssetsDataWithIds
      }, {})

      return {...assets, ...vaultAssetsDataWithIds}
    },{})
    return assetData
  }

  const selectVaultById = useCallback( (vaultId: string): Vault | null => {
    return state.vaults ? state.vaults.find( (vault: Vault) => vault.id.toLowerCase() === vaultId?.toLowerCase()) || null : null
  }, [state.vaults])

  const selectAssetById = useCallback( (assetId: AssetId | undefined): Asset | null => {
    return assetId && state.assetsData ? state.assetsData[assetId.toLowerCase()] : null
  }, [state.assetsData])

  const selectVaultTransactions = useCallback( (vaultId: AssetId | undefined): Transaction[] => {
    return vaultId && state.transactions ? state.transactions[vaultId.toLowerCase()] || [] : []
  }, [state.transactions])

  const selectAssetHistoricalPriceByTimestamp = useCallback( (assetId: AssetId | undefined, timestamp: string | number): HistoryData | null => {
    return assetId && state.historicalPrices[assetId.toLowerCase()] ? state.historicalPrices[assetId.toLowerCase()].find( (historyData: HistoryData) => +historyData.date === +timestamp ) : null
  }, [state.historicalPrices])

  const selectAssetHistoricalPriceUsdByTimestamp = useCallback( (assetId: AssetId | undefined, timestamp: string | number): HistoryData | null => {
    return assetId && state.historicalPricesUsd[assetId.toLowerCase()] ? state.historicalPricesUsd[assetId.toLowerCase()].find( (historyData: HistoryData) => +historyData.date === +timestamp ) : null
  }, [state.historicalPricesUsd])

  const selectAssetHistoricalPrices = useCallback( (assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalPrices[assetId.toLowerCase()] ? state.historicalPrices[assetId.toLowerCase()] : null
  }, [state.historicalPrices])

  const selectAssetHistoricalRates = useCallback( (assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalRates[assetId.toLowerCase()] ? state.historicalRates[assetId.toLowerCase()] : null
  }, [state.historicalRates])

  const selectAssetsByIds = useCallback( (assetIds: AssetId[]): Asset[] | null => {
    const assetIdsLowerCase = assetIds.map( assetId => assetId && assetId.toLowerCase() )
    return Object.keys(state.assetsData).filter( assetId => assetIdsLowerCase.includes(assetId) ).map( assetId => state.assetsData[assetId] )
  }, [state.assetsData])

  const selectVaultsAssetsByType = useCallback( (vaultType: string): Asset[] | null => {
    const vaults = state.vaults ? state.vaults.filter( (vault: Vault) => vault.type.toLowerCase() === vaultType.toLowerCase()) || null : null
    return Object.keys(state.assetsData).filter( assetId => vaults.map( (vault: Vault) => vault.id.toLowerCase() ).includes(assetId) ).map( assetId => state.assetsData[assetId] )
  }, [state.vaults, state.assetsData])

  const selectVaultsWithBalance = useCallback( (vaultType: string | null = null): Vault[] | null => {
    return state.vaults ? state.vaults.filter( (vault: Vault) => (!vaultType || vault.type.toLowerCase() === vaultType.toLowerCase()) && state.assetsData[vault.id.toLowerCase()] && state.assetsData[vault.id.toLowerCase()].balance && BNify(state.assetsData[vault.id.toLowerCase()].balance).gt(0) ) || null : null
  }, [state.vaults, state.assetsData])

  const selectVaultsByType = useCallback( (vaultType: string): Vault | null => {
    return state.vaults ? state.vaults.filter( (vault: Vault) => vault.type.toLowerCase() === vaultType.toLowerCase()) || null : null
  }, [state.vaults])

  const selectVaultGauge = useCallback( (vaultId: string): Vault | null => {
    const vault = selectVaultById(vaultId)
    if (!vault || !("gaugeConfig" in vault) || !vault.gaugeConfig || vault.type === 'GG') return null
    return selectVaultById(vault.gaugeConfig?.address)
  }, [selectVaultById])

  const selectVaultPosition = useCallback( (assetId: AssetId | undefined): VaultPosition | null => {
    if (!state.vaultsPositions || !assetId) return null
    return state.vaultsPositions[assetId.toLowerCase()] || null
  }, [state.vaultsPositions])

  const selectVaultPrice = useCallback( (assetId: AssetId | undefined): BigNumber => {
    if (!state.vaultsPrices || !assetId) return BNify(1)
    return state.vaultsPrices[assetId.toLowerCase()] || BNify(1)
  }, [state.vaultsPrices])

  const selectAssetPriceUsd = useCallback( (assetId: AssetId | undefined): BigNumber => {
    if (!state.pricesUsd || !assetId) return BNify(1)
    return state.pricesUsd[assetId.toLowerCase()] || BNify(1)
  }, [state.pricesUsd])

  const selectAssetTotalSupply = useCallback( (assetId: AssetId | undefined): BigNumber => {
    if (!state.totalSupplies || !assetId) return BNify(0)
    return state.totalSupplies[assetId.toLowerCase()] || BNify(0)
  }, [state.totalSupplies])

  const selectAssetBalance = useCallback( (assetId: AssetId | undefined): BigNumber => {
    if (!state.balances || !assetId) return BNify(0)
    return state.balances[assetId.toLowerCase()] || BNify(0)
  }, [state.balances])

  const selectAssetBalanceUsd = useCallback( (assetId: AssetId | undefined): BigNumber => {
    if (!state.balancesUsd || !assetId) return BNify(0)
    return state.balancesUsd[assetId.toLowerCase()] || BNify(0)
  }, [state.balancesUsd])

  const protocolToken = useMemo(() => {
    if (!selectAssetById) return
    const underlyingToken = selectUnderlyingToken(defaultChainId, PROTOCOL_TOKEN)
    return underlyingToken && selectAssetById(underlyingToken.address)
  }, [selectAssetById])

  const selectVaultsAssetsWithBalance = useCallback( (vaultType: string | null = null, includeStakedAmount: boolean = true): Asset[] | null => {
    const vaultsWithBalance = state.vaults ? state.vaults.filter( (vault: Vault) => {
      const assetBalance = selectAssetBalance(vault.id)
      const assetVaultPosition = selectVaultPosition(vault.id)
      const checkVaultType = !vaultType || vault.type.toLowerCase() === vaultType.toLowerCase()
      const vaultHasBalance = assetBalance.gt(0)
      const vaultHasStakedBalance = includeStakedAmount && BNify(assetVaultPosition?.underlying.staked).gt(0)
      return checkVaultType && (vaultHasBalance || vaultHasStakedBalance)
    }) : null
    return Object.keys(state.assetsData).filter( (assetId: AssetId) => vaultsWithBalance.map( (vault: Vault) => vault.id.toLowerCase() ).includes(assetId) ).map( (assetId: AssetId) => state.assetsData[assetId] )
  }, [state.vaults, state.assetsData, selectAssetBalance, selectVaultPosition])

  const vaultFunctionsHelper = useMemo((): VaultFunctionsHelper | null => {
    if (!chainId || !web3 || !multiCall || !explorer) return null
    return new VaultFunctionsHelper({chainId, web3, multiCall, explorer, cacheProvider})
  }, [chainId, web3, multiCall, explorer, cacheProvider])

  const genericContractsHelper = useMemo((): GenericContractsHelper | null => {
    if (!chainId || !web3 || !multiCall || !state.contracts.length) return null
    return new GenericContractsHelper({chainId, web3, multiCall, contracts: state.contracts})
  }, [chainId, web3, multiCall, state.contracts])

  const getUserTransactions = useCallback( async (startBlock: number, endBlock: string | number = 'latest'): Promise<EtherscanTransaction[]> => {
    if (!account?.address || !explorer || !chainId) return []
    const cacheKey = `${explorer.endpoints[chainId]}?module=account&action=tokentx&address=${account.address}`
    const cachedData = cacheProvider && cacheProvider.getCachedUrl(cacheKey)

    startBlock = cachedData ? cachedData.data.reduce( (t: number, r: any) => Math.max(t, +r.blockNumber), 0)+1 : startBlock

    const endpoint = `${explorer.endpoints[chainId]}?module=account&action=tokentx&address=${account.address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc`
    const etherscanTransactions = await makeEtherscanApiRequest(endpoint, explorer.keys)

    const dataToCache = new Set()
    if (cachedData){
      for (let tx of cachedData.data) {
        dataToCache.add(tx)
      }
    }
    for (let tx of etherscanTransactions) {
      dataToCache.add(tx)
    }
      
    if (cacheProvider){
      cacheProvider.saveData(cacheKey, Array.from(dataToCache.values()), 0)
    }

    // console.log('getUserTransactions', startBlock, endBlock, cachedData, endpoint, etherscanTransactions, Array.from(dataToCache.values()))

    return Array.from(dataToCache.values()) as EtherscanTransaction[]
  }, [account?.address, explorer, chainId, cacheProvider])

  const getVaultsPositions = useCallback( async (vaults: Vault[], test: boolean = false) => {

    if (!account?.address || !explorer || !chainId) return

    const startTimestamp = Date.now()

    const startBlock = vaults.reduce( (startBlock: number, vault: Vault): number => {
      if (!("getBlockNumber" in vault)) return startBlock
      const vaultBlockNumber = vault.getBlockNumber()
      if (!startBlock) return vaultBlockNumber
      return Math.min(startBlock, vaultBlockNumber)
    }, 0)
    
    const etherscanTransactions = await getUserTransactions(startBlock, test ? '14133495' : 'latest')
    // console.log('etherscanTransactions', startBlock, etherscanTransactions)

    const vaultsTransactions: Record<string, Transaction[]> = await asyncReduce<Vault, Record<string, Transaction[]>>(
      vaults,
      async (vault: Vault) => {
        if (!("getTransactions" in vault)) return {}
        const vaultTransactions = await vault.getTransactions(account.address, etherscanTransactions)

        return {
          [vault.id]: vaultTransactions
        }
      },
      (acc, value) => ({...acc, ...value}),
      {}
    )
    // console.log('vaultsTransactions', test, vaultsTransactions)

    const vaultsPositions = Object.keys(vaultsTransactions).reduce( (vaultsPositions: Record<string, VaultPosition>, assetId: AssetId) => {
      const transactions = vaultsTransactions[assetId]

      if (!transactions || !transactions.length) return vaultsPositions

      let firstDepositTx: any = null
      const vaultPrice = selectVaultPrice(assetId)

      const depositsInfo = transactions.reduce( (depositsInfo: {balancePeriods: any[], depositedAmount: BigNumber, depositedIdleAmount: BigNumber}, transaction: Transaction, index: number) => {
        switch (transaction.action) {
          case 'deposit':
          case 'stake':
            if (!firstDepositTx){
              firstDepositTx = transaction
            }
            depositsInfo.depositedAmount = depositsInfo.depositedAmount.plus(transaction.underlyingAmount)
            depositsInfo.depositedIdleAmount = depositsInfo.depositedIdleAmount.plus(transaction.idleAmount)
          break;
          case 'redeem':
          case 'unstake':
            depositsInfo.depositedAmount = BigNumber.maximum(0, depositsInfo.depositedAmount.minus(transaction.underlyingAmount))
            depositsInfo.depositedIdleAmount = BigNumber.maximum(0, depositsInfo.depositedIdleAmount.minus(transaction.idleAmount))
            if (depositsInfo.depositedAmount.lte(0)){
              firstDepositTx = null
              depositsInfo.balancePeriods = []
            }
          break;
          default:
          break;
        }

        // Update last period
        if (depositsInfo.balancePeriods.length>0){
          const lastBalancePeriod = depositsInfo.balancePeriods[depositsInfo.balancePeriods.length-1]

          lastBalancePeriod.duration = +transaction.timeStamp-lastBalancePeriod.timeStamp
          lastBalancePeriod.earningsPercentage = transaction.idlePrice.div(lastBalancePeriod.idlePrice).minus(1)
          lastBalancePeriod.realizedApr = BigNumber.maximum(0, lastBalancePeriod.earningsPercentage.times(31536000).div(lastBalancePeriod.duration))
          lastBalancePeriod.realizedApy = apr2apy(lastBalancePeriod.realizedApr).times(100)

          // console.log('Balance Period', assetId, dayjs(+lastBalancePeriod.timeStamp*1000).format('YYYY-MM-DD'), dayjs(+transaction.timeStamp*1000).format('YYYY-MM-DD'), lastBalancePeriod.duration, lastBalancePeriod.idlePrice.toString(), transaction.idlePrice.toString(), lastBalancePeriod.balance.toString(), lastBalancePeriod.earningsPercentage.toString(), lastBalancePeriod.realizedApr.toString(), lastBalancePeriod.realizedApy.toString(), transaction)
        }

        // Add period
        if (depositsInfo.depositedAmount.gt(0)){
          // Update period for last transactions
          const duration = index === transactions.length-1 ? Math.floor(Date.now()/1000)-(+transaction.timeStamp) : 0
          const earningsPercentage = duration ? vaultPrice.div(transaction.idlePrice).minus(1) : BNify(0)
          const realizedApr = duration ? BigNumber.maximum(0, earningsPercentage.times(31536000).div(duration)) : BNify(0)
          const realizedApy = realizedApr ? apr2apy(realizedApr).times(100) : BNify(0)

          if (duration>=86400 || index<transactions.length-1){
            depositsInfo.balancePeriods.push({
              duration,
              realizedApy,
              realizedApr,
              earningsPercentage,
              idlePrice: transaction.idlePrice,
              timeStamp: +transaction.timeStamp,
              balance: depositsInfo.depositedAmount
            })
          }

          // if (index === transactions.length-1) {
            // console.log('Balance Period', assetId, dayjs(+transaction.timeStamp*1000).format('YYYY-MM-DD'), dayjs(Date.now()).format('YYYY-MM-DD'), duration, transaction.idlePrice.toString(), vaultPrice.toString(), depositsInfo.depositedAmount.toString(), earningsPercentage.toString(), realizedApr.toString(), realizedApy.toString())
          // }
        }

        return depositsInfo
      }, {
        balancePeriods:[],
        depositedAmount: BNify(0),
        depositedIdleAmount: BNify(0)
      })

      // console.log('depositsInfo', assetId, depositsInfo)

      const { balancePeriods, depositedAmount, depositedIdleAmount } = depositsInfo

      if (depositedAmount.lte(0)) return vaultsPositions

      let stakedAmount = BNify(0);
      let vaultBalance = selectAssetBalance(assetId)
      const assetPriceUsd = selectAssetPriceUsd(assetId)
      const depositDuration = firstDepositTx ? Math.round(Date.now() / 1000) - parseInt(firstDepositTx.timeStamp) : 0

      // Add gauge balance to vault balance
      const gauge = selectVaultGauge(assetId)
      if (gauge){
        stakedAmount = selectAssetBalance(gauge.id)
        vaultBalance = vaultBalance.plus(stakedAmount)
      }

      // console.log(assetId, depositedAmount.toString(), vaultBalance.toString())

      // Wait for balances to be loaded
      if (vaultBalance.lte(0)) return vaultsPositions

      const realizedEarningsParams = balancePeriods.reduce( (realizedEarningsParams: {weight: BigNumber, sumAmount: BigNumber}, balancePeriod: any) => {
        const denom = balancePeriod.balance
        realizedEarningsParams.weight = realizedEarningsParams.weight.plus(balancePeriod.earningsPercentage.times(denom))
        realizedEarningsParams.sumAmount = realizedEarningsParams.sumAmount.plus(denom)
        return realizedEarningsParams
      }, {
        weight: BNify(0),
        sumAmount: BNify(0)
      })

      const realizedAprParams = balancePeriods.reduce( (realizedAprParams: {weight: BigNumber, sumAmount: BigNumber}, balancePeriod: any) => {
        const denom = balancePeriod.balance
        realizedAprParams.weight = realizedAprParams.weight.plus(balancePeriod.realizedApr.times(denom))
        realizedAprParams.sumAmount = realizedAprParams.sumAmount.plus(denom)
        return realizedAprParams
      }, {
        weight: BNify(0),
        sumAmount: BNify(0)
      })

      const realizedApyParams = balancePeriods.reduce( (realizedApyParams: {weight: BigNumber, sumAmount: BigNumber}, balancePeriod: any) => {
        const denom = balancePeriod.balance
        realizedApyParams.weight = realizedApyParams.weight.plus(balancePeriod.realizedApy.times(denom))
        realizedApyParams.sumAmount = realizedApyParams.sumAmount.plus(denom)
        return realizedApyParams
      }, {
        weight: BNify(0),
        sumAmount: BNify(0)
      })

      const realizedApr = realizedAprParams.weight.div(realizedAprParams.sumAmount)
      // const realizedApy = realizedApyParams.weight.div(realizedApyParams.sumAmount)
      const realizedApy = apr2apy(realizedApr).times(100)
      const realizedEarnings = realizedEarningsParams.weight.div(realizedEarningsParams.sumAmount)

      const redeemableAmount = vaultBalance.times(vaultPrice)
      const earningsAmount = redeemableAmount.minus(depositedAmount)
      const earningsPercentage = redeemableAmount.div(depositedAmount).minus(1)
      const avgBuyPrice = BigNumber.maximum(1, vaultPrice.div(earningsPercentage.plus(1)))

      // const realizedApy2 = earningsPercentage && depositDuration ? apr2apy(earningsPercentage.times(31536000).div(depositDuration)).times(100) : BNify(0)
      // console.log('realizedApy', assetId, realizedApyParams.weight.toString(), realizedApyParams.sumAmount.toString(), realizedEarnings.toString(), realizedApr.toString(), realizedApy.toString(), realizedApy2.toString())

      const idle = {
        staked: BNify(0),
        earnings: BNify(0),
        deposited: depositedIdleAmount,
        redeemable: depositedIdleAmount
      }

      const underlying = {
        staked: stakedAmount,
        earnings: earningsAmount,
        deposited: depositedAmount,
        redeemable: redeemableAmount
      }

      const usd = {
        staked: stakedAmount.times(assetPriceUsd),
        earnings: earningsAmount.times(assetPriceUsd),
        deposited: depositedAmount.times(assetPriceUsd),
        redeemable: redeemableAmount.times(assetPriceUsd)
      }

      vaultsPositions[assetId] = {
        usd,
        idle,
        underlying,
        realizedApy,
        avgBuyPrice,
        firstDepositTx,
        depositDuration,
        earningsPercentage
      }

      // const tokenPrice = await pricesCalls[0].call.call({}, parseInt(tx.blockNumber))
      // const realizedApy = earningsPercentage && depositDuration ? apr2apy(earningsPercentage.times(31536000).div(depositDuration)).times(100) : BNify(0)
      // console.log(assetId, 'vaultPrice', vaultPrice.toString(), 'depositedAmount', depositedAmount.toString(), 'vaultBalance', vaultBalance.toString(), 'redeemableAmount', redeemableAmount.toString(), 'earningsAmount', earningsAmount.toString(), 'earningsPercentage', earningsPercentage.toString(), 'avgBuyPrice', avgBuyPrice.toString())

      return vaultsPositions

    }, {})

    console.log('VAULTS POSITIONS LOADED in', (Date.now()-startTimestamp)/1000)

    return {
      vaultsPositions,
      vaultsTransactions
    }
  }, [account, explorer, chainId, selectVaultPrice, selectAssetPriceUsd, selectAssetBalance, selectVaultGauge, getUserTransactions])

  const getStkIdleCalls = useCallback((): CallData[] => {
    if (!web3 || !chainId || !multiCall || !state.contracts.length) return []
    
    const StkIdleContract = state.contracts.find( (Contract: GenericContract) => Contract.name === 'stkIDLE')
    const StakingFeeDistributorContract = state.contracts.find( (Contract: GenericContract) => Contract.name === 'StakingFeeDistributor')
    
    if (!StkIdleContract || !StakingFeeDistributorContract) return []

    return [
      multiCall.getCallData(StkIdleContract.contract, 'supply'),
      multiCall.getCallData(StkIdleContract.contract, 'totalSupply'),
      multiCall.getCallData(StkIdleContract.contract, 'locked', [account?.address]),
      multiCall.getCallData(StkIdleContract.contract, 'balanceOf', [account?.address]),
      multiCall.getCallData(StakingFeeDistributorContract.contract, 'claim', [account?.address])
    ].filter( (call): call is CallData => !!call )

  }, [account, web3, chainId, multiCall, state.contracts])

  // const getGaugesWeightsCalls = useCallback(async (vaults: Vault[]): Promise<Record<AssetId, BigNumber> | undefined> => {
  const getGaugesCalls = useCallback((vaults: Vault[]): CallData[][] | undefined => {
    if (!web3 || !chainId || !multiCall || !state.contracts.length) return
    const GaugeControllerContract = state.contracts.find( (Contract: GenericContract) => Contract.name === 'GaugeController')
    if (!GaugeControllerContract) return

    const gaugesVaults = vaults.filter(vault => vault instanceof GaugeVault)

    const gaugeCalls = gaugesVaults.reduce( (calls: CallData[][], vault: Vault): CallData[][] => {
      const rawCall1 = GaugeControllerContract.getRawCall('get_gauge_weight', [vault.id], vault.id)
      const callData1 = rawCall1 && multiCall.getDataFromRawCall(rawCall1.call, rawCall1)
      if (callData1){
        calls[0].push(callData1)
      }

      const rawCall2 = GaugeControllerContract.getRawCall('time_weight', [vault.id], vault.id)
      const callData2 = rawCall2 && multiCall.getDataFromRawCall(rawCall2.call, rawCall2)
      if (callData2){
        calls[1].push(callData2)
      }

      const rawCall3 = GaugeControllerContract.getRawCall('get_total_weight', [], vault.id)
      const callData3 = rawCall3 && multiCall.getDataFromRawCall(rawCall3.call, rawCall3)
      if (callData3){
        calls[2].push(callData3)
      }

      return calls
    }, [[],[],[]])

    // Add GaugeDistribution rate
    const GaugeDistributorContract = state.contracts.find( (Contract: GenericContract) => Contract.name === 'GaugeDistributor')
    if (GaugeDistributorContract){
      const rawCall = GaugeDistributorContract.getRawCall('rate', [])
      const callData = rawCall && multiCall.getDataFromRawCall(rawCall.call, rawCall)
      if (callData){
        gaugeCalls.push([callData])
      }
    }

    return gaugeCalls

  }, [web3, chainId, multiCall, state.contracts])

  const getVaultsOnchainData = useCallback( async (vaults: Vault[], enabledCalls: string[] = []): Promise<VaultsOnchainData | null> => {
    if (!multiCall || !vaultFunctionsHelper || !genericContractsHelper) return null

    const checkEnabledCall = (call: string) => {
      return !enabledCalls.length || enabledCalls.includes(call)
    }
    
    const rawCalls = vaults.reduce( (rawCalls: CallData[][], vault: Vault): CallData[][] => {
      const aggregatedRawCalls = [
        account && checkEnabledCall('balances') ? vault.getBalancesCalls([account.address]) : [],
        ("getPricesCalls" in vault) && checkEnabledCall('prices') ? vault.getPricesCalls() : [],
        ("getPricesUsdCalls" in vault) && checkEnabledCall('pricesUsd') ? vault.getPricesUsdCalls(state.contracts) : [],
        ("getAprsCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprsCalls() : [],
        ("getTotalSupplyCalls" in vault) && checkEnabledCall('totalSupplies') ? vault.getTotalSupplyCalls() : [],
        ("getFeesCalls" in vault) && checkEnabledCall('fees') ? vault.getFeesCalls() : [],
        ("getAprRatioCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprRatioCalls() : [],
        ("getBaseAprCalls" in vault) && checkEnabledCall('aprs') ? vault.getBaseAprCalls() : [],
        ("getProtocolsCalls" in vault) && checkEnabledCall('protocols') ? vault.getProtocolsCalls() : [],
        ("getRewardTokensCalls" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensCalls() : [],
        account && ("getRewardTokensAmounts" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensAmounts(account.address) : [],
        ("getMultiRewardsDataCalls" in vault) && checkEnabledCall('rewards') ? vault.getMultiRewardsDataCalls() : [],
        ("getClaimableMultiRewardsCalls" in vault) && account && checkEnabledCall('balances') ? vault.getClaimableMultiRewardsCalls(account.address) : [],
        ("getClaimableRewardsCalls" in vault) && account && checkEnabledCall('balances') ? vault.getClaimableRewardsCalls(account.address) : [],
        // ("getAllowanceCalls" in vault) ? vault.getAllowanceCalls() : []
      ]

      aggregatedRawCalls.forEach( (calls: ContractRawCall[], index: number) => {
        // Init array index
        if (rawCalls.length<=index){
          rawCalls.push([])
        }

        calls.forEach( (rawCall: ContractRawCall) => {
          const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
          if (callData){
            rawCalls[index].push(callData)
          }
        })
      })

      return rawCalls
    }, [])

    // Get vaults additional APRs
    const vaultsAdditionalAprsPromises = vaults.reduce( (promises: Map<AssetId, Promise<VaultAdditionalApr>>, vault: Vault): Map<AssetId, Promise<VaultAdditionalApr>> => {
      const assetKey = vault.id
      if (promises.has(assetKey)) return promises
      promises.set(assetKey, vaultFunctionsHelper.getVaultAdditionalApr(vault))
      return promises
    }, new Map())

    // Get vaults additional base APRs
    const vaultsAdditionalBaseAprsPromises = vaults.reduce( (promises: Map<AssetId, Promise<VaultAdditionalApr>>, vault: Vault): Map<AssetId, Promise<VaultAdditionalApr>> => {
      const assetKey = ("cdoConfig" in vault) ? vault.cdoConfig.address : vault.id
      if (promises.has(assetKey)) return promises
      promises.set(assetKey, vaultFunctionsHelper.getVaultAdditionalBaseApr(vault))
      return promises
    }, new Map())

    // Get vaults last harvests
    const vaultsLastHarvestsPromises = vaults.reduce( (promises: Map<AssetId, Promise<CdoLastHarvest> | undefined>, vault: Vault): Map<AssetId, Promise<CdoLastHarvest> | undefined> => {
      if (!("cdoConfig" in vault) || promises.has(vault.cdoConfig.address)) return promises
      promises.set(vault.cdoConfig.address, vaultFunctionsHelper.getTrancheLastHarvest(vault))
      return promises
    }, new Map())

    const stakedIdleVault = vaults.find( (vault: Vault) => vault.type === 'staking' ) as StakedIdleVault
    const stakedIdleVaultRewardsPromise = vaultFunctionsHelper.getStakingRewards(account?.address, stakedIdleVault)

    // Get Matic NFTs
    const maticNFTsPromise = checkEnabledCall('balances') && account?.address ? vaultFunctionsHelper.getMaticTrancheNFTs(account.address) : []

    // console.log('vaultsAdditionalBaseAprsPromises', vaultsAdditionalBaseAprsPromises)
    
    // Add gauges calls
    const gaugesWeightsCalls = getGaugesCalls(vaults)
    if (gaugesWeightsCalls){
      gaugesWeightsCalls.map( (calls: CallData[]) => rawCalls.push(calls) )
    }

    const stkIdleCalls = getStkIdleCalls()
    rawCalls.push(stkIdleCalls)
    
    // console.log('stkIdleCalls', stkIdleCalls)
    // console.log('rawCalls', enabledCalls, rawCalls)

    const [
      maticNFTs,
      stakedIdleVaultRewards,
      vaultsAdditionalAprs,
      vaultsAdditionalBaseAprs,
      vaultsLastHarvests,
      [
        balanceCallsResults,
        vaultsPricesCallsResults,
        pricesUsdCallsResults,
        aprsCallsResults,
        totalSupplyCallsResults,
        feesCallsResults,
        aprRatioResults,
        baseAprResults,
        protocolsResults,
        rewardTokensResults,
        rewardTokensAmountsResults,
        gaugeMultiRewardsData,
        gaugeClaimableMultiRewards,
        gaugeClaimableRewards,
        gaugesTimeWeights,
        gaugesWeights,
        gaugeTotalWeights,
        gaugesDistributionRate,
        stkIdleResults
      ]
    ] = await Promise.all([
      maticNFTsPromise,
      stakedIdleVaultRewardsPromise,
      Promise.all(Array.from(vaultsAdditionalAprsPromises.values())),
      Promise.all(Array.from(vaultsAdditionalBaseAprsPromises.values())),
      Promise.all(Array.from(vaultsLastHarvestsPromises.values())),
      multiCall.executeMultipleBatches(rawCalls)
    ])

    // console.log('totalSupply', totalSupply,
    //     'tokenTotalSupply', tokenTotalSupply,
    //     'lockedInfo', lockedInfo,
    //     'tokenUserBalance', tokenUserBalance,
    //     'claimable', claimable)

    // console.log('stkIdleResults', stkIdleResults)
    // console.log('stakedIdleVaultRewards', stakedIdleVaultRewards)

    const [
      stkIdleTotalLocked,
      stkIdleTotalSupply,
      stkIdleLock,
      stlIdleBalance,
      stkIdleClaimable
    ] = stkIdleResults.map( r => r.data )

    const firstRewardTimestamp: number = stakedIdleVaultRewards?.length ? +(stakedIdleVaultRewards[0] as EtherscanTransaction).timeStamp : 0
    const lastRewardTimestamp: number = stakedIdleVaultRewards?.length ? +(stakedIdleVaultRewards[stakedIdleVaultRewards.length-1] as EtherscanTransaction).timeStamp : 0
    const stkIdletotalRewardsDays = stakedIdleVaultRewards?.length ? Math.abs(lastRewardTimestamp-firstRewardTimestamp)/86400 : 0
    const stkIdleTotalRewards: BigNumber = stakedIdleVaultRewards.reduce( ( total: BigNumber, tx: EtherscanTransaction) => total.plus(fixTokenDecimals(tx.value, 18)), BNify(0) )
    const maxApr = stkIdleTotalRewards.div(fixTokenDecimals(stkIdleTotalLocked, 18)).times(365.2425).div(stkIdletotalRewardsDays).times(100)

    const stakingData: StakingData = {
      maxApr,
      lockEnd: +stkIdleLock.end,
      rewardsDays: stkIdletotalRewardsDays,
      IDLE: {
        totalRewards: stkIdleTotalRewards,
        claimable: fixTokenDecimals(stkIdleClaimable, 18),
        deposited: fixTokenDecimals(stkIdleLock.amount, 18),
        totalSupply: fixTokenDecimals(stkIdleTotalLocked, 18)
      },
      stkIDLE: {
        balance: fixTokenDecimals(stlIdleBalance, 18),
        totalSupply: fixTokenDecimals(stkIdleTotalSupply, 18),
        share: fixTokenDecimals(stlIdleBalance, 18).div(fixTokenDecimals(stkIdleTotalSupply, 18))
      }
    }

    // console.log('stakingData', stakingData)

    // console.log('maticNFTs', maticNFTs)
    // console.log('gaugeRewardContracts', gaugeRewardContracts)
    // console.log('gaugesRelativeWeights', gaugesRelativeWeights)
    // console.log('gaugesDistributionRate', gaugesDistributionRate)
    // console.log('gaugesRelativeWeights', gaugesRelativeWeights)
    // console.log('gaugeMultiRewardsData', gaugeMultiRewardsData)
    // console.log('gaugeClaimableRewards', gaugeClaimableRewards)
    // console.log('gaugeClaimableMultiRewards', gaugeClaimableMultiRewards)

    // console.log('pricesCallsResults', pricesCallsResults)
    // console.log('pricesUsdCallsResults', pricesUsdCallsResults)
    // console.log('balanceCallsResults', balanceCallsResults)
    // console.log('totalSupplyCallsResults', totalSupplyCallsResults)
    // console.log('feesCallsResults', feesCallsResults)
    // console.log('aprRatioResults', aprRatioResults)
    // console.log('baseAprResults', baseAprResults)
    // console.log('protocolsResults', protocolsResults)
    // console.log('vaultsLastHarvests', vaultsLastHarvests)
    // console.log('rewardTokens', rewardTokensResults)
    // console.log('rewardTokensAmounts', rewardTokensAmountsResults)
    // console.log('gaugesTimeWeights', gaugesTimeWeights)
    // console.log('gaugesWeights', gaugesWeights)

    // const assetsData: Assets = {
    //   ...state.assetsData
    // }

    // Process protocols
    const lastAllocationsCalls = protocolsResults.reduce( (calls: ContractRawCall[], callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const vault = selectVaultById(assetId)
        if (vault && ("getAllocationsCalls" in vault)){
          callResult.data[0].forEach( (protocolAddress: string, index: number) => {
            calls.push(...vault.getAllocationsCalls(index, { protocolAddress }))
          })
        }
      }
      return calls
    }, [])

    const allocationsResults = await multiCall.executeMulticalls(multiCall.getCallsFromRawCalls(lastAllocationsCalls))

    // Process allocations
    const allocations = allocationsResults ? allocationsResults.reduce( (allocations: Record<AssetId, Balances>, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const vault = selectVaultById(assetId)
        if (vault && ("tokenConfig" in vault) && ("protocols" in vault.tokenConfig)){
          const protocolAddress = callResult.extraData.data?.protocolAddress
          if (!protocolAddress) return allocations

          const protocolInfo = vault.tokenConfig?.protocols.find( protocolInfo => protocolInfo.address.toLowerCase() === protocolAddress.toLowerCase() )
          if (!protocolInfo) return allocations

          const protocolName = protocolInfo.name
          const allocationPercentage = BNify(callResult.data.toString()).div(`1e03`)

          allocations[assetId] = {
            ...allocations[assetId],
            [protocolName]: allocationPercentage
          }
        }
      }
      return allocations
    }, {}) : {}

    // Set allocations
    /*
    Object.keys(allocations).forEach( (assetId: AssetId) => {
      assetsData[assetId] = {
        ...assetsData[assetId],
        allocations: allocations[assetId]
      }
    })
    */

    // Process Apr Ratio
    const aprRatios = aprRatioResults.reduce( (aprRatios: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const trancheAPRSplitRatio = BNify(callResult.data.toString()).div(`1e03`)
          const aprRatio = asset.type === 'AA' ? trancheAPRSplitRatio : BNify(100).minus(trancheAPRSplitRatio)

          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   aprRatio
          // }

          aprRatios[assetId] = aprRatio
        }
      }
      return aprRatios
    }, {})

    const vaultsRewards: VaultsRewards = {}

    // Process Rewards
    const rewards = rewardTokensAmountsResults.reduce( (rewards: Record<AssetId, Balances>, callResult: DecodedResult): Record<AssetId, Balances> => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const rewardTokens = rewardTokensResults.find( rewardTokensCall => rewardTokensCall.extraData.assetId?.toString() === assetId )
          if (!rewardTokens) return rewards
          
          const assetRewards = callResult.data.reduce( (assetRewards: Balances, amount: string, rewardIndex: number): Balances => {
            const rewardId = rewardTokens.data[rewardIndex]
            const rewardAsset = selectAssetById(rewardId)
            if (!rewardAsset) return assetRewards
            const rewardAmount = fixTokenDecimals(amount, rewardAsset.decimals)

            // Init rewards and add reward amount
            if (rewardAmount.gt(0)){
              if (!vaultsRewards[rewardId]){
                vaultsRewards[rewardId] = {
                  assets: [],
                  amount: BNify(0)
                }
              }
              vaultsRewards[rewardId].assets.push(assetId)
              vaultsRewards[rewardId].amount = vaultsRewards[rewardId].amount.plus(rewardAmount)
            }

            return {
              ...assetRewards,
              [rewardId]: rewardAmount
            }
          }, {})

          rewards[assetId] = assetRewards
        }
      }
      return rewards
    }, {})

    // console.log('vaultsRewards', vaultsRewards)

    // Process Strategy Aprs
    const baseAprs = baseAprResults.reduce( (baseAprs: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const vault = selectVaultById(assetId)
          let baseApr = BNify(callResult.data.toString()).div(`1e18`)

          // Add additional Apr
          const vaultAdditionalBaseApr: VaultAdditionalApr | undefined = vaultsAdditionalBaseAprs.find( (apr: VaultAdditionalApr) => (apr.vaultId === assetId || (vault && "cdoConfig" in vault && apr.cdoId === vault.cdoConfig?.address)) )
          if (vaultAdditionalBaseApr){
            baseApr = baseApr.plus(vaultAdditionalBaseApr.apr)
            // console.log(`Base Apr ${asset.name}: ${vaultAdditionalBaseApr.apr.toString()} = ${baseApr.toString()}`)
          }

          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   baseApr
          // }

          baseAprs[assetId] = baseApr
        }
      }

      return baseAprs
    }, {})

    // Process last harvest blocks
    const additionalAprs: Balances = {}
    const lastHarvests = (Object.values(vaultsLastHarvests) as CdoLastHarvest[]).reduce( (lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>, lastHarvest: CdoLastHarvest) => {
      const cdoId = lastHarvest.cdoId
      const filteredVaults = vaults.filter( (vault: Vault) => ("cdoConfig" in vault) && vault.cdoConfig.address === cdoId )
      filteredVaults.forEach( (vault: Vault) => {
        const assetId = vault.id

        // assetsData[assetId] = {
        //   ...assetsData[assetId],
        //  lastHarvest: lastHarvest.harvest || null 
        // }

        lastHarvests[assetId] = lastHarvest.harvest || null
      })

      return lastHarvests
    }, {})

    const aprsBreakdown: Record<AssetId, Balances> = {}

    const aprs = aprsCallsResults.reduce( (aprs: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        const vault = selectVaultById(assetId)
        if (asset && vault){
          const decimals = callResult.extraData.decimals || 18
          aprs[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)

          // Add additional Apr
          const vaultAdditionalApr: VaultAdditionalApr | undefined = vaultsAdditionalAprs.find( (apr: VaultAdditionalApr) => (apr.vaultId === assetId) )
          if (vaultAdditionalApr){
            const additionalApr = vaultAdditionalApr.apr.div(`1e${decimals}`)
            // console.log(`Additional Apr ${asset.name}: ${aprs[assetId].toString()} + ${additionalApr.toString()} = ${aprs[assetId].plus(additionalApr).toString()}`)
            aprs[assetId] = aprs[assetId].plus(additionalApr)
          }

          aprsBreakdown[assetId] = {
            base: aprs[assetId]
          }

          additionalAprs[assetId] = BNify(0)

          // Add harvest apr
          if (lastHarvests[assetId]) {
            additionalAprs[assetId] = additionalAprs[assetId].plus(BNify(lastHarvests[assetId]?.aprs[vault.type]).times(100))
            // console.log(`Additional Apr ${asset.name}: ${aprs[assetId].toString()} + ${additionalAprs[assetId].toString()} = ${aprs[assetId].plus(additionalAprs[assetId]).toString()}`)
            aprs[assetId] = aprs[assetId].plus(additionalAprs[assetId])
            aprsBreakdown[assetId].harvest = additionalAprs[assetId]
          }

          const apy = apr2apy(aprs[assetId].div(100)).times(100)

          // console.log(`Apr ${asset.name}: ${aprs[assetId].toString()}`)
          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   apr: aprs[assetId],
          //   apy
          // }
        }
      }
      return aprs
    }, {})

    // Process Fees
    const fees = feesCallsResults.reduce( (fees: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const fee = BNify(callResult.data.toString()).div(`1e05`)
          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   fee
          // }

          fees[assetId] = fee
        }
      }
      return fees
    }, {})

    const balances = balanceCallsResults.reduce( (balances: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          balances[assetId] = BNify(callResult.data.toString()).div(`1e${asset.decimals}`)
          // console.log(`Balance ${asset.name}: ${balances[assetId].toString()}`)
          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   balance: balances[assetId]
          // }
        }
      }
      return balances
    }, {})

    const vaultsPrices = vaultsPricesCallsResults.reduce( (vaultsPrices: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const decimals = callResult.extraData.decimals || asset.decimals
          vaultsPrices[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)
          // console.log(`Vault Price ${asset.name} ${decimals}: ${vaultsPrices[assetId].toString()}`)
          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   vaultPrice: vaultsPrices[assetId]
          // }
        }
      }
      return vaultsPrices
    }, {})

    const pricesUsd = pricesUsdCallsResults.reduce( (pricesUsd: Balances, callResult: DecodedResult) => {
      const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
      const asset = selectAssetById(assetId)
      if (asset){
        pricesUsd[assetId] = callResult.data ? callResult.extraData.params.processResults(callResult.data, callResult.extraData.params) : BNify(1)
        // console.log(`Asset Price Usd ${asset.name}: ${pricesUsd[assetId].toString()}`)
        // assetsData[assetId] = {
        //   ...assetsData[assetId],
        //   priceUsd: pricesUsd[assetId]
        // }
        // if (asset.underlyingId){
        //   assetsData[asset.underlyingId] = {
        //     ...assetsData[asset.underlyingId],
        //     priceUsd: pricesUsd[asset.underlyingId]
        //   }
        // }
      }
      return pricesUsd
    }, {})

    const totalSupplies = totalSupplyCallsResults.reduce( (totalSupplies: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const decimals = callResult.extraData.decimals || asset.decimals
          totalSupplies[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)
          // assetsData[assetId] = {
          //   ...assetsData[assetId],
          //   totalSupply: totalSupplies[assetId]
          // }
        }
      }
      return totalSupplies
    }, {})

    // Process Gauges data
    const gaugesRelativeWeights: Record<string, DecodedResult[]> | null = gaugesTimeWeights ? await genericContractsHelper.getGaugesRelativeWeights(gaugesTimeWeights) : {}
    
    const gaugesData = gaugesRelativeWeights ? gaugesRelativeWeights.weights.reduce( (gaugesData: GaugesData, callResult: DecodedResult) => {
      const gaugeId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
      const gaugeVault = selectVaultById(gaugeId)
      if (!gaugeVault || !("getGaugeRewardData" in gaugeVault)) return gaugesData

      const weight = fixTokenDecimals(callResult.data, 18)
      const nextWeightResult = gaugesRelativeWeights.nextWeights.find( (callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId )
      const nextWeight = nextWeightResult ? fixTokenDecimals(nextWeightResult.data, 18) : weight
      const totalSupply = totalSupplies[gaugeId] || selectAssetTotalSupply(gaugeId)
      const distributionRate = fixTokenDecimals(gaugesDistributionRate[0].data, 18).times(86400).times(weight)

      const tranchePrice = vaultsPrices[gaugeVault.trancheToken.address] || selectVaultPrice(gaugeVault.trancheToken.address)
      const tranchePriceUsd = pricesUsd[gaugeVault.trancheToken.address] || selectAssetPriceUsd(gaugeVault.trancheToken.address)

      const gaugePoolUsd = totalSupply.times(tranchePrice).times(tranchePriceUsd)

      const claimableRewards = gaugeClaimableRewards.find( (callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId )
      const multiRewardsData = gaugeMultiRewardsData.filter( (callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId )
      const claimableMultiRewards = gaugeClaimableMultiRewards.filter( (callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId )

      const rewards: GaugeRewards = {}

      if (claimableRewards && gaugeVault.rewardToken?.address){
        const rewardData = gaugeVault.getGaugeRewardData(gaugeVault.rewardToken.address, BNify(claimableRewards.data))
        if (rewardData){
          rewards[gaugeVault.rewardToken.address] = {
            ...rewardData,
            rate: distributionRate
          }
        }
      }

      if (multiRewardsData){
        for (const callResult of multiRewardsData) {
          const rewardDistributionData = callResult.data
          if (rewardDistributionData) {
            const rewardTokenAddress = callResult.callData.args[0][0].toLowerCase()
            const rewardClaimableBalance = claimableMultiRewards?.find( (claimableMultiReward: DecodedResult) => claimableMultiReward.callData.args[1][0].toLowerCase() === rewardTokenAddress )
            const rewardData = gaugeVault.getGaugeRewardData(rewardTokenAddress, BNify(rewardClaimableBalance?.data), rewardDistributionData.rewardRate)
            // console.log('multireward token', rewardTokenAddress, claimableMultiRewards, rewardClaimableBalance, rewardData)
            if (rewardData){
              const rewardTokenPriceUsd = pricesUsd[rewardTokenAddress] || selectAssetPriceUsd(rewardTokenAddress)
              const yearRewardsUsd = rewardTokenPriceUsd && rewardData.rate ? rewardData.rate.times(rewardTokenPriceUsd).times(365) : BNify(0)
              const apr = yearRewardsUsd.div(gaugePoolUsd).times(100)
              // console.log('Reward token APR', rewardTokenAddress, rewardData.rate.toString(), rewardTokenPriceUsd, yearRewardsUsd.toFixed(), gaugePoolUsd.toFixed(), rewardTokenAPR.toFixed())
              rewards[rewardTokenAddress] = {
                ...rewardData,
                apr
              }
            }
          }
        }
      }

      const gaugeData = {
        weight,
        rewards,
        nextWeight,
        totalSupply,
        gaugePoolUsd,
        distributionRate
      }

      // assetsData[gaugeId] = {
      //   ...assetsData[gaugeId],
      //   gaugeData
      // }

      return {
        ...gaugesData,
        [gaugeId]: gaugeData
      }
    }, {}) : {}

    // console.log('gaugesData', gaugesData)
    // console.log('totalSupplies', totalSupplies)

    // console.log('assetsData', assetsData)
    // Set assets data one time instead of updating for every asset

    // console.log('aprs', aprs)
    // console.log('balances', balances)
    // console.log('pricesUsd', pricesUsd)
    // console.log('prices', vaultsPrices)
    // console.log('totalSupplies', totalSupplies)

    return {
      fees,
      aprs,
      rewards,
      balances,
      baseAprs,
      pricesUsd,
      aprRatios,
      maticNFTs,
      // assetsData,
      gaugesData,
      stakingData,
      allocations,
      lastHarvests,
      vaultsPrices,
      totalSupplies,
      aprsBreakdown,
      vaultsRewards,
      additionalAprs
    }
  }, [selectAssetById, account, multiCall, selectVaultById, state.contracts, genericContractsHelper, vaultFunctionsHelper, getGaugesCalls, getStkIdleCalls, selectAssetPriceUsd, selectAssetTotalSupply, selectVaultPrice])

  useEffect(() => {
    if (!protocolToken) return
    dispatch({type:'SET_PROTOCOL_TOKEN', payload: protocolToken})
  }, [protocolToken])

  // Update on-chain data of last transaction asset
  useEffect(() => {
    if (!lastTransaction || !state.isPortfolioLoaded) return
    if (!lastTransaction?.lastUpdated || lastTransaction.lastUpdated<state.portfolioTimestamp) return

    // console.log('lastTransaction', lastTransaction)
    const asset = selectAssetById(lastTransaction.vaultId as string)
    const vault = selectVaultById(lastTransaction.vaultId as string)

    if (!asset || asset.type === 'underlying' || !vault) return

    const vaults = [vault as Vault]

    if (("underlyingId" in asset) && asset.underlyingId){
      const underlyingVault = selectVaultById(asset.underlyingId)
      vaults.push(underlyingVault as Vault)
    }

    const gaugeVault = selectVaultGauge(vault.id)
    if (gaugeVault) {
      vaults.push(gaugeVault as Vault)

      if ("rewardTokens" in gaugeVault){
        for (const rewardToken of gaugeVault.rewardTokens){
          if (rewardToken.address) {
            const underlyingRewardVault = selectVaultById(rewardToken.address)
            vaults.push(underlyingRewardVault as Vault)
          }
        }
      }
    }

    // console.log('Last Transaction Vault', vault)
    // console.log('Last Transaction Asset', asset)

    ;(async () => {
      console.log('Update vaults after transaction', vaults)
      const vaultsOnChainData = await getVaultsOnchainData(vaults);
      if (!vaultsOnChainData) return
      console.log('getVaultsOnchainData', vaultsOnChainData)

      const {
        fees,
        aprs,
        rewards,
        balances,
        baseAprs,
        pricesUsd,
        aprRatios,
        maticNFTs,
        gaugesData,
        allocations,
        stakingData,
        lastHarvests,
        vaultsPrices,
        totalSupplies,
        aprsBreakdown,
        vaultsRewards,
        additionalAprs
      } = vaultsOnChainData

      const newAprs = vaults.map( (vault: Vault) => vault.id ).reduce( (newAprs: Balances, vaultId: AssetId) => {
        if (!aprs[vaultId]){
          newAprs[vaultId] = BNify(0)
          return newAprs
        }
        return {
          ...newAprs,
          [vaultId]: aprs[vaultId]
        }
      }, {...state.aprs})

      const newFees = vaults.map( (vault: Vault) => vault.id ).reduce( (newFees: Balances, vaultId: AssetId) => {
        if (!fees[vaultId]){
          newFees[vaultId] = BNify(0)
          return newFees
        }
        return {
          ...newFees,
          [vaultId]: fees[vaultId]
        }
      }, {...state.fees})

      const newRewards = vaults.map( (vault: Vault) => vault.id ).reduce( (newRewards: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!rewards[vaultId]){
          delete newRewards[vaultId]
          return newRewards
        }
        return {
          ...newRewards,
          [vaultId]: rewards[vaultId]
        }
      }, {...state.rewards})

      // Generate newVaultsRewards from new rewards
      const newVaultsRewards = (Object.keys(newRewards) as AssetId[]).reduce( (vaultsRewards: VaultsRewards, vaultId: AssetId) => {
        const vaultRewards = newRewards[vaultId]
        for (const rewardId in vaultRewards){
          const rewardAmount = BNify(vaultRewards[rewardId])

          // Init rewards and add reward amount
          if (rewardAmount.gt(0)){
            if (!vaultsRewards[rewardId]){
              vaultsRewards[rewardId] = {
                assets: [],
                amount: BNify(0)
              }
            }
            vaultsRewards[rewardId].assets.push(vaultId)
            vaultsRewards[rewardId].amount = vaultsRewards[rewardId].amount.plus(rewardAmount)
          }
        }
        return vaultsRewards
      }, {})

      const newBaseAprs = vaults.map( (vault: Vault) => vault.id ).reduce( (newBaseAprs: Balances, vaultId: AssetId) => {
        if (!baseAprs[vaultId]){
          newBaseAprs[vaultId] = BNify(0)
          return newBaseAprs
        }
        return {
          ...newBaseAprs,
          [vaultId]: baseAprs[vaultId]
        }
      }, {...state.baseAprs})

      const newBalances = vaults.map( (vault: Vault) => vault.id ).reduce( (newBalances: Balances, vaultId: AssetId) => {
        if (!balances[vaultId]){
          newBalances[vaultId] = BNify(0)
          return newBalances
        }
        return {
          ...newBalances,
          [vaultId]: balances[vaultId]
        }
      }, {...state.balances})

      const newPricesUsd = vaults.map( (vault: Vault) => vault.id ).reduce( (newPricesUsd: Balances, vaultId: AssetId) => {
        if (!pricesUsd[vaultId]){
          newPricesUsd[vaultId] = BNify(1)
          return newPricesUsd
        }
        return {
          ...newPricesUsd,
          [vaultId]: pricesUsd[vaultId]
        }
      }, {...state.pricesUsd})

      const newAprRatios = vaults.map( (vault: Vault) => vault.id ).reduce( (newAprRatios: Balances, vaultId: AssetId) => {
        if (!aprRatios[vaultId]){
          newAprRatios[vaultId] = BNify(0)
          return newAprRatios
        }
        return {
          ...newAprRatios,
          [vaultId]: aprRatios[vaultId]
        }
      }, {...state.aprRatios})

      const newAllocations = vaults.map( (vault: Vault) => vault.id ).reduce( (newAllocations: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!allocations[vaultId]){
          delete newAllocations[vaultId]
          return newAllocations
        }
        return {
          ...newAllocations,
          [vaultId]: allocations[vaultId]
        }
      }, {...state.allocations})

      const newLastHarvests = vaults.map( (vault: Vault) => vault.id ).reduce( (newLastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>, vaultId: AssetId) => {
        if (!lastHarvests[vaultId]){
          delete newLastHarvests[vaultId]
          return newLastHarvests
        }
        return {
          ...newLastHarvests,
          [vaultId]: lastHarvests[vaultId]
        }
      }, {...state.lastHarvests})

      const newVaultsPrices = vaults.map( (vault: Vault) => vault.id ).reduce( (newVaultsPrices: Balances, vaultId: AssetId) => {
        if (!vaultsPrices[vaultId]){
          newVaultsPrices[vaultId] = BNify(1)
          return newVaultsPrices
        }
        return {
          ...newVaultsPrices,
          [vaultId]: vaultsPrices[vaultId]
        }
      }, {...state.vaultsPrices})

      const newTotalSupplies = vaults.map( (vault: Vault) => vault.id ).reduce( (newTotalSupplies: Balances, vaultId: AssetId) => {
        if (!totalSupplies[vaultId]){
          newTotalSupplies[vaultId] = BNify(0)
          return newTotalSupplies
        }
        return {
          ...newTotalSupplies,
          [vaultId]: totalSupplies[vaultId]
        }
      }, {...state.totalSupplies})

      const newAprsBreakdown = vaults.map( (vault: Vault) => vault.id ).reduce( (newAprsBreakdown: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!aprsBreakdown[vaultId]){
          delete newAprsBreakdown[vaultId]
          return newAprsBreakdown
        }
        return {
          ...newAprsBreakdown,
          [vaultId]: aprsBreakdown[vaultId]
        }
      }, {...state.aprsBreakdown})

      const newAdditionalAprs = vaults.map( (vault: Vault) => vault.id ).reduce( (newAdditionalAprs: Balances, vaultId: AssetId) => {
        if (!additionalAprs[vaultId]){
          newAdditionalAprs[vaultId] = BNify(0)
          return newAdditionalAprs
        }
        return {
          ...newAdditionalAprs,
          [vaultId]: additionalAprs[vaultId]
        }
      }, {...state.additionalAprs})

      // const newAprs = {...state.aprs, ...aprs}
      // const newFees = {...state.fees, ...fees}
      // const newRewards = {...state.rewards, ...rewards}
      // const newBaseAprs = {...state.baseAprs, ...baseAprs}
      // const newBalances = {...state.balances, ...balances}
      // const newAprRatios = {...state.aprRatios, ...aprRatios}
      // const newPricesUsd = {...state.pricesUsd, ...pricesUsd}
      // const newAssetsData = {...state.assetsData, ...assetsData}
      // const newAllocations = {...state.allocations, ...allocations}
      // const newLastHarvests = {...state.lastHarvests, ...lastHarvests}
      // const newVaultsPrices = {...state.vaultsPrices, ...vaultsPrices}
      // const newVaultsRewards = {...state.vaultsRewards, ...vaultsRewards}
      // const newTotalSupplies = {...state.totalSupplies, ...totalSupplies}
      // const newAprsBreakdown = {...state.aprsBreakdown, ...aprsBreakdown}
      // const newAdditionalAprs = {...state.additionalAprs, ...additionalAprs}

      // console.log('newAprs', newAprs, 'newFees', newFees, 'newRewards', newRewards, 'newBaseAprs', newBaseAprs, 'newBalances', newBalances, 'newAprRatios', newAprRatios, 'newPricesUsd', newPricesUsd, 'newAllocations', newAllocations, 'newLastHarvests', newLastHarvests, 'newVaultsPrices', newVaultsPrices, 'newVaultsRewards', newVaultsRewards, 'newTotalSupplies', newTotalSupplies, 'newAprsBreakdown', newAprsBreakdown, 'newAdditionalAprs', newAdditionalAprs)

      // Save assets data first
      // dispatch({type: 'SET_ASSETS_DATA', payload: newAssetsData})
      dispatch({type: 'SET_FEES', payload: newFees})
      dispatch({type: 'SET_APRS', payload: newAprs})
      dispatch({type: 'SET_REWARDS', payload: newRewards})
      dispatch({type: 'SET_BALANCES', payload: newBalances})
      dispatch({type: 'SET_MATIC_NTFS', payload: maticNFTs})
      dispatch({type: 'SET_BASE_APRS', payload: newBaseAprs})
      dispatch({type: 'SET_GAUGES_DATA', payload: gaugesData})
      dispatch({type: 'SET_APR_RATIOS', payload: newAprRatios})
      dispatch({type: 'SET_PRICES_USD', payload: newPricesUsd})
      dispatch({type: 'SET_STAKING_DATA', payload: stakingData})
      dispatch({type: 'SET_ALLOCATIONS', payload: newAllocations})
      dispatch({type: 'SET_LAST_HARVESTS', payload: newLastHarvests})
      dispatch({type: 'SET_VAULTS_PRICES', payload: newVaultsPrices})
      dispatch({type: 'SET_VAULTS_REWARDS', payload: newVaultsRewards})
      dispatch({type: 'SET_APRS_BREAKDOWN', payload: newAprsBreakdown})
      dispatch({type: 'SET_TOTAL_SUPPLIES', payload: newTotalSupplies})
      dispatch({type: 'SET_ADDITIONAL_APRS', payload: newAdditionalAprs})
      dispatch({type: 'SET_PORTFOLIO_TIMESTAMP', payload: Date.now()})
    })()

  // eslint-disable-next-line
  }, [lastTransaction, state.isPortfolioLoaded])

  // Init underlying tokens and vaults contracts
  useEffect(() => {

    if (!web3 || !chainId || !cacheProvider?.isLoaded) return

    // Init global contracts
    const contracts = globalContracts[chainId].map( (contract: GenericContractConfig) => {
      return new GenericContract(web3, chainId, contract)
    })

    // Init underlying tokens vaults
    const underlyingTokensVaults = Object.keys(underlyingTokens[chainId]).reduce( ( vaultsContracts: UnderlyingToken[], token) => {
      const tokenConfig = underlyingTokens[chainId][token]
      if (tokenConfig.address) {
        const underlyingToken = new UnderlyingToken(web3, chainId, tokenConfig)
        vaultsContracts.push(underlyingToken)
      }
      return vaultsContracts
    }, [])

    // Init tranches vaults
    const trancheVaults = Object.keys(tranches[chainId]).reduce( (vaultsContracts: TrancheVault[], protocol) => {
      Object.keys(tranches[chainId][protocol]).forEach( token => {
        const vaultConfig = tranches[chainId][protocol][token]
        const gaugeConfig = Object.values(gauges).find( gaugeConfig => gaugeConfig.trancheToken.address.toLowerCase() === vaultConfig.Tranches.AA.address.toLowerCase() )
        const trancheVaultAA = new TrancheVault({web3, web3Rpc, chainId, protocol, vaultConfig, gaugeConfig, type: 'AA', cacheProvider})
        const trancheVaultBB = new TrancheVault({web3, web3Rpc, chainId, protocol, vaultConfig, gaugeConfig: null, type: 'BB', cacheProvider})
        vaultsContracts.push(trancheVaultAA)
        vaultsContracts.push(trancheVaultBB)
      })
      return vaultsContracts
    }, [])

    // Init best yield vaults
    const bestYieldVaults = Object.keys(bestYield[chainId]).reduce( (vaultsContracts: BestYieldVault[], token) => {
      const tokenConfig = bestYield[chainId][token]
      const trancheVault = new BestYieldVault({web3, web3Rpc, chainId, tokenConfig, type: 'BY', cacheProvider})
      vaultsContracts.push(trancheVault)
      return vaultsContracts
    }, [])

    const gaugeDistributorProxy = contracts.find( c => c.name === 'GaugeDistributorProxy' )

    // Init gauges vaults
    const gaugesVaults = Object.keys(gauges).reduce( (vaultsContracts: GaugeVault[], token) => {
      const gaugeConfig = gauges[token]
      const trancheVault = trancheVaults.find( tranche => tranche.trancheConfig.address.toLowerCase() === gaugeConfig.trancheToken.address.toLowerCase() )
      if (!trancheVault) return vaultsContracts
      const gaugeVault = new GaugeVault({web3, chainId, gaugeConfig, trancheVault, cacheProvider, gaugeDistributorProxy})
      vaultsContracts.push(gaugeVault)
      return vaultsContracts
    }, [])

    // Init stkIDLE vault
    const rewardTokenConfig = selectUnderlyingToken(chainId, PROTOCOL_TOKEN) as UnderlyingTokenProps
    const stkIdleConfig = globalContracts[chainId].find( (contract: GenericContractConfig) => contract.name === 'stkIDLE' ) as GenericContractConfig
    const feeDistributorConfig = globalContracts[chainId].find( (contract: GenericContractConfig) => contract.name === 'StakingFeeDistributor' ) as GenericContractConfig

    const stakedIdleVault = new StakedIdleVault({web3, chainId, rewardTokenConfig, stkIdleConfig, feeDistributorConfig})
    // console.log('stakedIdleVault', stakedIdleVault)

    const allVaults = [...underlyingTokensVaults, ...trancheVaults, ...bestYieldVaults, ...gaugesVaults, stakedIdleVault]
    
    const assetsData = generateAssetsData(allVaults)
    dispatch({type: 'SET_VAULTS', payload: allVaults})
    dispatch({type: 'SET_CONTRACTS', payload: contracts})
    dispatch({type: 'SET_ASSETS_DATA_IF_EMPTY', payload: assetsData})

    // Cleanup
    return () => {
      // dispatch({type: 'SET_VAULTS', payload: []})
      // dispatch({type: 'SET_CONTRACTS', payload: []})
      // const assetsData = generateAssetsData(allVaults)
      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
    };

  // eslint-disable-next-line
  }, [web3, web3Rpc, chainId, cacheProvider?.isLoaded])

  // Set selectors
  useEffect(() => {
    const selectors = {
      selectVaultById,
      selectAssetById,
      selectVaultPrice,
      selectVaultGauge,
      selectAssetsByIds,
      selectVaultsByType,
      selectAssetBalance,
      selectVaultPosition,
      selectAssetPriceUsd,
      selectAssetBalanceUsd,
      selectVaultTransactions,
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectAssetHistoricalRates,
      selectAssetHistoricalPrices,
      selectVaultsAssetsWithBalance,
      selectAssetHistoricalPriceByTimestamp,
      selectAssetHistoricalPriceUsdByTimestamp,
    }

    dispatch({type: 'SET_SELECTORS', payload: selectors})
  }, [
    selectVaultById,
    selectAssetById,
    selectVaultGauge,
    selectVaultPrice,
    selectAssetsByIds,
    selectVaultsByType,
    selectAssetBalance,
    selectAssetPriceUsd,
    selectVaultPosition,
    selectAssetBalanceUsd,
    selectVaultTransactions,
    selectVaultsWithBalance,
    selectVaultsAssetsByType,
    selectAssetHistoricalRates,
    selectAssetHistoricalPrices,
    selectVaultsAssetsWithBalance,
    selectAssetHistoricalPriceByTimestamp,
    selectAssetHistoricalPriceUsdByTimestamp,
  ])

  useEffect(() => {
    const helpers = {
      vaultFunctionsHelper,
      genericContractsHelper
    }
    dispatch({type: 'SET_HELPERS', payload: helpers})
  }, [
    vaultFunctionsHelper,
    genericContractsHelper
  ])

  const getChainlinkHistoricalPrices = useCallback(async (vaults: Vault[], maxDays: number = 365): Promise<Record<AssetId, HistoryData[]> | undefined> => {

    if (!web3 || !chainId || !multiCall) return

    const chainlinkHelper: ChainlinkHelper = new ChainlinkHelper(chainId, web3, multiCall)

    // Get assets chainlink feeds
    const vaultsUnderlyingTokens = vaults.reduce( ( assets: Record<AssetId, UnderlyingTokenProps>, vault: Vault): Record<AssetId, UnderlyingTokenProps> => {
      if (!("underlyingToken" in vault) || !vault.underlyingToken) return assets
      const underlyingTokenAddress = vault.underlyingToken?.address?.toLowerCase()
      if (underlyingTokenAddress && !assets[underlyingTokenAddress]) {
        assets[underlyingTokenAddress] = vault.underlyingToken
      }
      return assets
    }, {})

    const feedsCalls = Object.keys(vaultsUnderlyingTokens).reduce( (calls: CallData[][], assetId: AssetId): CallData[][] => {

      const underlyingToken = vaultsUnderlyingTokens[assetId]
      const address = underlyingToken.chainlinkPriceFeed?.address || assetId

      const rawCallUsd = chainlinkHelper.getUsdFeedAddressRawCall(address, assetId)
      const callDataUsd = rawCallUsd && multiCall.getDataFromRawCall(rawCallUsd.call, rawCallUsd)
      if (callDataUsd) calls[0].push(callDataUsd)

      return calls
    }, [[],[]])

    const [
      feedsUsd
    ] = await multiCall.executeMultipleBatches(feedsCalls)

    // console.log('feedsUsd', feedsUsd)

    // Group feeds by asset
    const assetsFeedsUsd = feedsUsd.reduce( (assetsFeedsUsd: Record<AssetId, string | null>, callResult: DecodedResult): Record<AssetId, string | null> => {
      const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
      const underlyingToken = vaultsUnderlyingTokens[assetId]
      const feedAddress = callResult.data || underlyingToken.chainlinkPriceFeed
      return {
        ...assetsFeedsUsd,
        [assetId]: feedAddress
      }
    }, {})

    // console.log('assetsFeedsUsd', assetsFeedsUsd)

    // Get feeds rounds bounds (timestamp, latestRound, latestTimestamp)
    const feedsUsdRoundBoundsCalls = Object.keys(assetsFeedsUsd).reduce( (calls: CallData[][], assetId: string) => {
      const feedUsdAddress = assetsFeedsUsd[assetId]
      if (!feedUsdAddress) return calls
      const feedRoundBoundsRawCalls = chainlinkHelper.getFeedRoundBoundsRawCalls(assetId, feedUsdAddress)
      const newCalls = multiCall.getCallsFromRawCalls(feedRoundBoundsRawCalls)

      // Group by index
      newCalls.forEach( (callData: CallData, index: number) => {
        if (!calls[index]) calls[index] = []
        calls[index].push(callData)
      })

      return calls
    }, [])

    const [
      feedsUsdTimestampResults,
      feedsUsdLatestRoundResults,
      feedsUsdLatestTimestampResults,
    ] = await multiCall.executeMultipleBatches(feedsUsdRoundBoundsCalls)

    // console.log('feedsUsdRoundBoundsResults', feedsUsdTimestampResults, feedsUsdLatestRoundResults, feedsUsdLatestTimestampResults)

    // Generate assets usd feeds rounds bounds (latestRound, firstTimestamp, latestTimestamp)
    const feedsUsdRoundBounds = Array.from(Array(feedsUsdTimestampResults.length).keys()).reduce( (feedsUsdRoundBounds: Record<AssetId, FeedRoundBounds>, callIndex: number): Record<AssetId, FeedRoundBounds> => {
      const { data: firstTimestamp } = feedsUsdTimestampResults[callIndex]
      const { data: latestRound } = feedsUsdLatestRoundResults[callIndex]
      const { data: latestTimestamp } = feedsUsdLatestTimestampResults[callIndex]
      const assetId = feedsUsdTimestampResults[callIndex].extraData.assetId?.toString() || feedsUsdTimestampResults[callIndex].callData.target.toLowerCase()
      return {
        ...feedsUsdRoundBounds,
        [assetId]: {
          latestRound,
          firstTimestamp,
          latestTimestamp,
        }
      }
    }, {})

    // console.log('feedsUsdRoundBounds', feedsUsdRoundBounds)

    // Get Chainlink historical assets prices
    const historicalPricesCalls = Object.keys(vaultsUnderlyingTokens).reduce( (calls: CallData[], assetId: AssetId): CallData[] => {
      const feedUsdAddress = assetsFeedsUsd[assetId]
      const feedUsdRoundBounds = feedsUsdRoundBounds[assetId]

      if (!feedUsdAddress || !feedUsdRoundBounds) return calls

      const rawCalls = chainlinkHelper.getHistoricalPricesRawCalls(assetId, feedUsdAddress, feedUsdRoundBounds, maxDays)
      return [
        ...calls,
        ...multiCall.getCallsFromRawCalls(rawCalls)
      ]
    }, [])

    // const startTimestamp = Date.now();
    const results = await multiCall.executeMulticalls(historicalPricesCalls)
    // console.log('historicalPricesCalls - DECODED', (Date.now()-startTimestamp)/1000, results)

    const assetsPricesUsd: Record<AssetId, Record<number, HistoryData>> = {}
    results?.forEach( (callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const date = +(dayjs(+callResult.data.startedAt*1000).startOf('day').valueOf())
          const value = parseFloat(BNify(callResult.data.answer.toString()).div(`1e08`).toFixed(8))
          if (!assetsPricesUsd[assetId]) {
            assetsPricesUsd[assetId] = {}
          }
          assetsPricesUsd[assetId][date] = {
            date,
            value
          }
        }
      }
    })
      
    const historicalPricesUsd: Record<AssetId, HistoryData[]> = Object.keys(assetsPricesUsd).reduce( (historicalPricesUsd: Record<AssetId, HistoryData[]>, assetId: AssetId) => {
      return {
        ...historicalPricesUsd,
        [assetId]: Object.values(assetsPricesUsd[assetId])
      }
    }, {})

    return historicalPricesUsd
  }, [chainId, web3, multiCall, selectAssetById])

  // Get historical underlying prices from chainlink
  useEffect(() => {

    if (isEmpty(state.vaults) || !isEmpty(state.historicalPricesUsd) || !web3 || !multiCall || !storedHistoricalPricesUsdLoaded) return

    // console.log('Check historicalPricesUsd', storedHistoricalPricesUsdLoaded, storedHistoricalPricesUsd)

    // Load 1 year by default
    let maxDays = 365

    // Prices are already stored
    if (!isEmpty(storedHistoricalPricesUsd) && storedHistoricalPricesUsd.timestamp){
      const daysDiff = dayDiff(Date.now(), storedHistoricalPricesUsd.timestamp)
      // console.log('storedHistoricalPricesUsd', Date.now(), storedHistoricalPricesUsd.timestamp, daysDiff)
      if (!daysDiff){
        // console.log('storedHistoricalPricesUsd', storedHistoricalPricesUsd.historicalPricesUsd)
        return dispatch({type: 'SET_HISTORICAL_PRICES_USD', payload: storedHistoricalPricesUsd.historicalPricesUsd})
      } else {
        // Load missing days
        maxDays = daysDiff
      }
    }

    // Get Historical data
    ;(async () => {

      const startTimestamp = Date.now()

      const historicalPricesUsd = await getChainlinkHistoricalPrices(state.vaults, maxDays)
      // console.log('getChainlinkHistoricalPrices', maxDays, historicalPricesUsd)
      if (!historicalPricesUsd) return

      // Merge new with stored prices
      const mergedHistoricalPricesUsd = storedHistoricalPricesUsd.historicalPricesUsd ? {...storedHistoricalPricesUsd.historicalPricesUsd} : {}
      Object.keys(historicalPricesUsd).forEach( (assetId: AssetId) => {
        const assetPricesUsd = historicalPricesUsd[assetId]
        if (!mergedHistoricalPricesUsd[assetId]){
          mergedHistoricalPricesUsd[assetId] = []
        }

        // Just store new prices
        if (mergedHistoricalPricesUsd[assetId].length){
          const latestTimestamp = [...mergedHistoricalPricesUsd[assetId]].pop().date
          const newAssetPricesUSd = assetPricesUsd.filter( assetPriceUsd => +assetPriceUsd.date>+latestTimestamp )
          mergedHistoricalPricesUsd[assetId] = [
            ...mergedHistoricalPricesUsd[assetId],
            ...newAssetPricesUSd
          ]
          // console.log('Chainlink Prices (MERGE)', assetId, newAssetPricesUSd, mergedHistoricalPricesUsd)
        // Store all the prices
        } else {
          mergedHistoricalPricesUsd[assetId] = [...assetPricesUsd]
          // console.log('Chainlink Prices (SET)', assetId,  assetPricesUsd, mergedHistoricalPricesUsd)
        }
      })

      const assetsData: Assets = {
        ...state.assetsData
      }

      // Set assets data
      Object.keys(mergedHistoricalPricesUsd).forEach( (assetId: AssetId) => {
        const pricesUsd = mergedHistoricalPricesUsd[assetId]
        assetsData[assetId] = {
          ...assetsData[assetId],
         pricesUsd
        }
      })

      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})

      // Store and dispatch
      setHistoricalPricesUsd({
        timestamp: Date.now(),
        historicalPricesUsd: mergedHistoricalPricesUsd
      })

      // Pre-cached data
      // console.log('historicalPricesCalls - DECODED', (Date.now()-startTimestamp)/1000, mergedHistoricalPricesUsd)

      dispatch({type: 'SET_HISTORICAL_PRICES_USD', payload: mergedHistoricalPricesUsd})
    })()
  // eslint-disable-next-line
  }, [state.vaults, web3, multiCall, storedHistoricalPricesUsdLoaded, getChainlinkHistoricalPrices])
  
  // Get historical vaults data
  useEffect(() => {

    if (isEmpty(state.vaults) || !state.isPortfolioLoaded || !isEmpty(state.historicalRates)) return

    // Get Historical data
    ;(async () => {
      const startTimestamp = Date.now();

      // Fetch historical data from the first deposit (min 1 year)
      const vaultsHistoricalDataPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
        const asset = selectAssetById(vault.id)
        if (asset) {
          // const firstDepositTimestamp = asset.vaultPosition?.firstDepositTx?.timeStamp
          const startTimestamp = /*firstDepositTimestamp ? firstDepositTimestamp : */dayjs().subtract(1, 'year').unix()
          const start = Math.round(dayjs(+startTimestamp*1000).startOf('day').valueOf()/1000)
          const end = Math.round(dayjs().endOf('day').valueOf()/1000)

          // Get vaults historical rates
          const historicalAprsFilters = {
            frequency: 86400,
            start,
            end
          }

          promises.push(vault.getHistoricalData(historicalAprsFilters))
        }
        return promises
      }, [])

      const vaultsHistoricalData = await Promise.all(vaultsHistoricalDataPromises)

      const rates: Record<AssetId, HistoryData[]> = {}
      const prices: Record<AssetId, HistoryData[]> = {}

      vaultsHistoricalData.forEach( (vaultHistoricalData: VaultHistoricalData) => {
        const assetId = vaultHistoricalData.vaultId
        const asset = selectAssetById(assetId)
        if (asset){
          rates[assetId] = vaultHistoricalData.rates
          prices[assetId] = vaultHistoricalData.prices
          dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { rates: rates[assetId], prices: prices[assetId] } }})
        }
      })

      dispatch({type: 'SET_HISTORICAL_RATES', payload: rates})
      dispatch({type: 'SET_HISTORICAL_PRICES', payload: prices})

      console.log('HISTORICAL DATA LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()

  // eslint-disable-next-line
  }, [state.vaults, state.isPortfolioLoaded])

  // Get tokens prices, balances, rates
  useEffect(() => {
    if (!state.vaults.length || !state.contracts.length || !multiCall) return

    // Avoid refreshing if disconnected
    if (!isEmpty(state.aprs) && !account?.address) {
      return dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
    }
    
    // console.log('Loading Portfolio', account?.address, state.isPortfolioLoaded, state.aprs)

    // dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})

    ;(async () => {
      const startTimestamp = Date.now()

      // Update balances only if account changed
      const enabledCalls = []
      if (!isEmpty(state.aprs)) {
        enabledCalls.push('balances', 'rewards')
      }

      const vaultsOnChainData = await getVaultsOnchainData(state.vaults, enabledCalls)
      if (!vaultsOnChainData) return
      // console.log('Vaults Data', state.vaults, enabledCalls, vaultsOnChainData)

      const {
        fees,
        aprs,
        rewards,
        balances,
        baseAprs,
        pricesUsd,
        aprRatios,
        maticNFTs,
        // assetsData,
        gaugesData,
        stakingData,
        allocations,
        lastHarvests,
        vaultsPrices,
        aprsBreakdown,
        vaultsRewards,
        totalSupplies,
        additionalAprs
      } = vaultsOnChainData

      // const gaugeWeights = await getGaugesWeights(state.vaults)

      // Always update assets data
      // dispatch({type: 'SET_ASSETS_DATA', payload: {...state.assetsData, ...assetsData}})

      if (!enabledCalls.length || enabledCalls.includes('fees')) {
        dispatch({type: 'SET_FEES', payload: {...state.fees, ...fees}})
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        dispatch({type: 'SET_APR_RATIOS', payload: {...state.aprRatios, ...aprRatios}})
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        dispatch({type: 'SET_BASE_APRS', payload: {...state.baseAprs, ...baseAprs}})
      }
      if (!enabledCalls.length || enabledCalls.includes('protocols')) {
        dispatch({type: 'SET_ALLOCATIONS', payload: {...state.allocations, ...allocations}})
      }
      
      dispatch({type: 'SET_STAKING_DATA', payload: stakingData})
      dispatch({type: 'SET_LAST_HARVESTS', payload: {...state.lastHarvests, ...lastHarvests}})

      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        dispatch({type: 'SET_APRS', payload: {...state.aprs, ...aprs}})
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        dispatch({type: 'SET_ADDITIONAL_APRS', payload: {...state.additionalAprs, ...additionalAprs}})
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        dispatch({type: 'SET_APRS_BREAKDOWN', payload: {...state.aprsBreakdown, ...aprsBreakdown}})
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        dispatch({type: 'SET_REWARDS', payload: {...state.rewards, ...rewards}})
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        dispatch({type: 'SET_VAULTS_REWARDS', payload: {...state.vaultsRewards, ...vaultsRewards}})
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        dispatch({type: 'SET_BALANCES', payload: {...state.balances, ...balances}})
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        dispatch({type: 'SET_MATIC_NTFS', payload: maticNFTs})
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        dispatch({type: 'SET_GAUGES_DATA', payload: {...state.gaugesData, ...gaugesData}})
      }
      if (!enabledCalls.length || enabledCalls.includes('pricesUsd')) {
        dispatch({type: 'SET_PRICES_USD', payload: {...state.pricesUsd, ...pricesUsd}})
      }
      if (!enabledCalls.length || enabledCalls.includes('prices')) {
        dispatch({type: 'SET_VAULTS_PRICES', payload: {...state.vaultsPrices, ...vaultsPrices}})
      }
      if (!enabledCalls.length || enabledCalls.includes('totalSupplies')) {
        dispatch({type: 'SET_TOTAL_SUPPLIES', payload: {...state.totalSupplies, ...totalSupplies}})
      }

      // Don't update if partial loading
      if (!state.isPortfolioLoaded) {
        dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
      }

      console.log('PORTFOLIO LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')    
    })()

    // Cleanup
    return () => {
      // dispatch({type: 'SET_APRS', payload: {}})
      dispatch({type: 'SET_REWARDS', payload: {}})
      dispatch({type: 'SET_BALANCES', payload: {}})
      dispatch({type: 'SET_MATIC_NTFS', payload: []})
      // dispatch({type: 'SET_GAUGES_DATA', payload: {}})
      dispatch({type: 'SET_VAULTS_REWARDS', payload: {}})
      // dispatch({type: 'SET_PRICES_USD', payload: {}})
      // dispatch({type: 'SET_VAULTS_PRICES', payload: {}})
      // dispatch({type: 'SET_TOTAL_SUPPLIES', payload: {}})
      // dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})
      // console.log('RESET PORTFOLIO')
    };
  // eslint-disable-next-line
  }, [account, state.vaults, state.contracts, multiCall])

  // Get user vaults positions
  useEffect(() => {
    if (!account?.address || !state.isPortfolioLoaded || isEmpty(state.balances) || !walletInitialized || connecting) return
    // console.log('Load Vaults Positions', account?.address, state.isPortfolioLoaded, walletInitialized, connecting)

    ;(async () => {

      const test = false //!state.isVaultsPositionsLoaded
      const results = await getVaultsPositions(state.vaults, test)
      // console.log('getVaultsPositions', state.balances, results)

      if (!results) return

      const {
        vaultsPositions,
        vaultsTransactions
      } = results

      dispatch({type: 'SET_VAULTS_POSITIONS_LOADED', payload: true})
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions})
      dispatch({type: 'SET_VAULTS_TRANSACTIONS', payload: vaultsTransactions})
    })()

    // Clean transactions and positions
    return () => {
      // if (!account?.address || !state.isPortfolioLoaded || !walletInitialized || connecting){
        dispatch({type: 'SET_VAULTS_POSITIONS', payload: {}})
        dispatch({type: 'SET_VAULTS_TRANSACTIONS', payload: []})
        dispatch({type: 'SET_VAULTS_POSITIONS_LOADED', payload: false})
      // }

      // Reset all vaults positions
      // const assetsData: Assets = {
      //   ...state.assetsData
      // }
      // for (const assetId in assetsData){
      //   delete assetsData[assetId].vaultPosition
      // }
      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
    };
  // eslint-disable-next-line
  }, [account, state.isPortfolioLoaded, state.balances, state.portfolioTimestamp, walletInitialized, connecting])
  
  // Update balances USD
  useEffect(() => {
    if (isEmpty(state.balances) || isEmpty(state.vaultsPositions)) return

    const startTimestamp = Date.now();

    const balancesUsd = Object.keys(state.balances).reduce( (balancesUsd: Balances, assetId) => {
      const asset = selectAssetById(assetId)
      if (asset) {
        const vaultPrice = selectVaultPrice(assetId)
        let assetBalance = selectAssetBalance(assetId)
        const assetPriceUsd = selectAssetPriceUsd(assetId)
        const vaultPosition = selectVaultPosition(assetId)

        // Add staked amount
        if (vaultPosition) {
          assetBalance = assetBalance.plus(vaultPosition.underlying.staked)
        }

        balancesUsd[assetId] = assetBalance.times(vaultPrice).times(assetPriceUsd)

        // if (!asset.balanceUsd || !asset.balanceUsd.eq(balancesUsd[assetId])){
        //   dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {balanceUsd: balancesUsd[assetId]} }})
        // }
      }
      return balancesUsd
    }, {})

    dispatch({type: 'SET_BALANCES_USD', payload: balancesUsd})

    console.log('BALANCES LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')

    // Cleanup
    return () => {
      dispatch({type: 'SET_BALANCES_USD', payload: {}})
    };

  // eslint-disable-next-line
  }, [state.balances, state.vaultsPositions, selectVaultPosition, selectAssetPriceUsd, selectAssetBalance, selectVaultPrice])

  // Update TVLs
  /*
  useEffect(() => {
    Object.keys(state.totalSupplies).forEach( assetId => {
      const asset = selectAssetById(assetId)
      if (asset) {
        const vaultPrice = selectVaultPrice(assetId)
        const assetPriceUsd = selectAssetPriceUsd(assetId)
        const assetTotalSupply = selectAssetTotalSupply(assetId)

        const tvl = assetTotalSupply.times(vaultPrice)
        const tvlUsd = tvl.times(assetPriceUsd)

        if (!asset.tvlUsd || !asset.tvlUsd.eq(tvlUsd)){
          dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {tvl, tvlUsd} }})
        }
      }
    })
  // eslint-disable-next-line
  }, [state.totalSupplies, state.vaultsPrices, state.pricesUsd])
  */

  // Set Gauges Rewards
  useEffect(() => {
    if (!state.isPortfolioLoaded || !state.isVaultsPositionsLoaded || isEmpty(state.vaultsPositions)) return

    const gaugesVaultsAssets = selectVaultsAssetsByType('GG')
    if (!gaugesVaultsAssets) return

    const gaugesRewards = gaugesVaultsAssets.reduce( (gaugesRewards: GaugesRewards, gauge: Asset) => {
      const gaugeData = gauge.gaugeData
      const gaugeVaultPosition = gauge.vaultPosition
      if (!gaugeData || !gaugeVaultPosition) return gaugesRewards

      for (const rewardId in gaugeData.rewards) {

        const gaugeRewardData = gaugeData.rewards[rewardId]
        const gaugeShare = gauge.totalSupply ? BNify(gaugeVaultPosition.underlying.redeemable).div(gauge.totalSupply) : BNify(0)

        if (gaugeShare.gt(0)){
          if (!gaugesRewards[rewardId]){
            gaugesRewards[rewardId] = {
              deposited: BNify(0),
              balance: BNify(0),
              rate: BNify(0),
              apr: BNify(0),
              gauges: []
            }
          }

          gaugesRewards[rewardId].gauges.push(gauge.id as string)
          gaugesRewards[rewardId].deposited = BNify(gaugesRewards[rewardId].deposited).plus(gaugeVaultPosition.usd.deposited)

          if (gaugeRewardData.rate) {
            gaugesRewards[rewardId].rate = BNify(gaugesRewards[rewardId].rate).plus(BNify(gaugeRewardData.rate).times(gaugeShare))
          }
          if (gaugeRewardData.balance){
            gaugesRewards[rewardId].balance = BNify(gaugesRewards[rewardId].balance).plus(gaugeRewardData.balance)
          }
          if (gaugeRewardData.apr) {
            gaugesRewards[rewardId].apr = BNify(gaugesRewards[rewardId].apr).plus(BNify(gaugeRewardData.apr).times(gaugeVaultPosition.usd.deposited))
          }
        }
      }

      return gaugesRewards
    }, {})

    for (const rewardId in gaugesRewards){
      gaugesRewards[rewardId].apr = BNify(gaugesRewards[rewardId].apr).div(gaugesRewards[rewardId].deposited)
    }

    dispatch({type: 'SET_GAUGES_REWARDS', payload: gaugesRewards})

    return () => {
      dispatch({type: 'SET_GAUGES_REWARDS', payload: {}})
    }

  }, [state.vaultsPositions, state.isVaultsPositionsLoaded, state.isPortfolioLoaded, selectVaultsAssetsByType])

  // Generate Assets Data
  useEffect(() => {
    if (isEmpty(state.vaults)) return

    const assetsData = generateAssetsData(state.vaults)
    for (const vault of state.vaults){
      assetsData[vault.id].fee = state.fees[vault.id]
      assetsData[vault.id].rewards =  state.rewards[vault.id]
      assetsData[vault.id].baseApr =  state.baseAprs[vault.id] || BNify(0)
      assetsData[vault.id].balance =  state.balances[vault.id] || BNify(0)
      assetsData[vault.id].aprRatio =  state.aprRatios[vault.id]
      assetsData[vault.id].priceUsd =  state.pricesUsd[vault.id] || BNify(1)
      assetsData[vault.id].gaugeData =  state.gaugesData[vault.id]
      assetsData[vault.id].balanceUsd =  state.balancesUsd[vault.id] || BNify(0)
      assetsData[vault.id].allocations =  state.allocations[vault.id]
      assetsData[vault.id].vaultPrice =  state.vaultsPrices[vault.id] || BNify(1)
      assetsData[vault.id].lastHarvest =  state.lastHarvests[vault.id] || null
      assetsData[vault.id].totalSupply =  state.totalSupplies[vault.id] || BNify(0)
      assetsData[vault.id].pricesUsd = state.historicalPricesUsd[vault.id]
      assetsData[vault.id].vaultPosition =  state.vaultsPositions[vault.id]
      assetsData[vault.id].additionalApr =  state.additionalAprs[vault.id] || BNify(0)
      assetsData[vault.id].tvl = BNify(0)
      assetsData[vault.id].tvlUsd = BNify(0)
      assetsData[vault.id].totalTvl = BNify(0)

      // Update Underlying price Usd
      if (vault.underlyingToken?.address){
        assetsData[vault.underlyingToken.address.toLowerCase()].priceUsd = assetsData[vault.id].priceUsd
      }

      assetsData[vault.id].aprBreakdown =  state.aprsBreakdown[vault.id] || {}

      // Add gauge to vault apr breakdown
      if (vault.type==='GG' && ("trancheVault" in vault)){
        const trancheVault = vault.trancheVault
        if (trancheVault) {
          if (assetsData[vault.id].gaugeData?.rewards){
            const gaugeRewards = assetsData[vault.id].gaugeData?.rewards || []
            const aprBreakdown = assetsData[trancheVault.id].aprBreakdown || {}
            aprBreakdown.gauge = (Object.values(gaugeRewards) as GaugeRewardData[])
              .reduce( (total: BigNumber, rewardData: GaugeRewardData) => {
                if (!rewardData.apr) return total
                return total.plus(BNify(rewardData.apr))
              }, BNify(0))

            assetsData[trancheVault.id].aprBreakdown = aprBreakdown
          }
        }
      }

      if (assetsData[vault.id].aprBreakdown){
        assetsData[vault.id].apyBreakdown = Object.keys(assetsData[vault.id].aprBreakdown || {}).reduce( (apyBreakdown: Balances, type: string): Balances => {
          const apr = assetsData[vault.id].aprBreakdown?.[type]
          if (apr){
            apyBreakdown[type] = apr2apy(BNify(apr).div(100)).times(100)
          }
          return apyBreakdown
        }, {})
      }

      // Calculate APR and APY using the breakdowns
      assetsData[vault.id].apr = assetsData[vault.id].aprBreakdown ? (Object.values(assetsData[vault.id].aprBreakdown || {}) as BigNumber[]).reduce( (total: BigNumber, apr: BigNumber) => total.plus(apr), BNify(0)) : BNify(0)
      assetsData[vault.id].apy = assetsData[vault.id].apyBreakdown ? (Object.values(assetsData[vault.id].apyBreakdown || {}) as BigNumber[]).reduce( (total: BigNumber, apy: BigNumber) => total.plus(apy), BNify(0)) : BNify(0)

      // Set historical rates
      assetsData[vault.id].rates = state.historicalRates[vault.id] || []

      // Set historical prices
      assetsData[vault.id].prices = state.historicalPrices[vault.id] || []
      if (assetsData[vault.id].prices?.length){
        // Calculate APY 7 days
        const rates7 = assetsData[vault.id].prices!.slice(assetsData[vault.id].prices!.length-7)
        const rates7_last_rate = rates7 ? BNify(rates7.pop()?.value) : BNify(0)
        assetsData[vault.id].apy7 = rates7_last_rate.div(BNify(rates7[0].value)).minus(1).times(365).div(7).times(100)

        // console.log('rates7', vault.id, rates7, BNify(rates7[0].value).toString(), rates7_last_rate.toString(), assetsData[vault.id].apy7.toString())

        // Calculate APY 30 days
        const rates30 = assetsData[vault.id].prices!.slice(assetsData[vault.id].prices!.length-30)
        const rates30_last_rate = rates30 ? BNify(rates30.pop()?.value) : BNify(0)
        assetsData[vault.id].apy30 = rates30_last_rate.div(BNify(rates30[0].value)).minus(1).times(365).div(30).times(100)

        // console.log('rates30', vault.id, rates30, BNify(rates30[0].value).toString(), rates30_last_rate.toString(), assetsData[vault.id].apy30.toString())
      }

      // console.log('aprBreakdown', vault.id, assetsData[vault.id].aprBreakdown)

      if (!BNify(assetsData[vault.id].totalSupply).isNaN() && !BNify(assetsData[vault.id].vaultPrice).isNaN() && !BNify(assetsData[vault.id].priceUsd).isNaN()){
        assetsData[vault.id].tvl = BNify(assetsData[vault.id].totalSupply).times(BNify(assetsData[vault.id].vaultPrice))
        assetsData[vault.id].tvlUsd = BNify(assetsData[vault.id].tvl).times(BNify(assetsData[vault.id].priceUsd))
        assetsData[vault.id].totalTvl = BNify(assetsData[vault.id].tvl)

        if ("vaultConfig" in vault && assetsData[vault.id].type && ['AA','BB'].includes(assetsData[vault.id].type as string)){
          const otherVaultType = assetsData[vault.id].type === 'AA' ? 'BB' : 'AA'
          const otherVault = state.vaults.find( (otherVault: TrancheVault) => otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address )
          if (otherVault){
            const otherVaultAsset = assetsData[otherVault.id]
            if (otherVaultAsset.tvl) {
              assetsData[vault.id].totalTvl = BNify(assetsData[vault.id].tvl).plus(BNify(otherVaultAsset.tvl))
              assetsData[otherVault.id].totalTvl = BNify(assetsData[vault.id].tvl).plus(BNify(otherVaultAsset.tvl))
              // console.log('Other Vault', vault.id, otherVault.id, BNify(assetsData[vault.id].tvl).toString(), BNify(otherVaultAsset.tvl).toString(), BNify(assetsData[vault.id].totalTvl).toString())
            }
          }
        }
      }
    }

    // console.log('Generate assets data', assetsData)
    dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
  }, [
    state.vaults,
    state.fees,
    state.aprs,
    state.baseAprs,
    state.balances,
    state.aprRatios,
    state.pricesUsd,
    state.gaugesData,
    state.rewards,
    state.historicalRates,
    state.historicalPrices,
    state.vaultsRewards,
    state.balancesUsd,
    state.vaultsPrices,
    state.totalSupplies,
    state.allocations,
    state.lastHarvests,
    state.aprsBreakdown,
    state.additionalAprs,
    state.vaultsPositions,
    state.historicalPricesUsd
  ])

  return (
    <PortfolioProviderContext.Provider value={state}>
      {children}
    </PortfolioProviderContext.Provider>
  )
}
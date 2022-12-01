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
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { useCacheProvider } from 'contexts/CacheProvider'
import { GenericContract } from 'contracts/GenericContract'
import { historicalPricesUsd } from 'constants/historicalData'
import type { CallData, DecodedResult } from 'classes/Multicall'
import type { CdoLastHarvest } from 'classes/VaultFunctionsHelper'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { VaultFunctionsHelper, ChainlinkHelper, FeedRoundBounds } from 'classes/'
import React, { useContext, useEffect, useMemo, useCallback, useReducer } from 'react'
import type { GenericContractConfig, UnderlyingTokenProps, ContractRawCall } from 'constants/'
import { BNify, makeEtherscanApiRequest, apr2apy, isEmpty, dayDiff, fixTokenDecimals } from 'helpers/'
import { globalContracts, bestYield, tranches, gauges, underlyingTokens, defaultChainId, EtherscanTransaction, PROTOCOL_TOKEN } from 'constants/'
import type { ReducerActionTypes, VaultsRewards, Balances, Asset, AssetId, Assets, Vault, Transaction, VaultPosition, VaultAdditionalApr, VaultHistoricalData, HistoryData } from 'constants/types'

type InitialState = {
  aprs: Balances
  vaults: Vault[]
  balances: Balances
  assetsData: Assets
  pricesUsd: Balances
  balancesUsd: Balances
  rewards: VaultsRewards
  vaultsPrices: Balances
  totalSupplies: Balances
  isPortfolioLoaded: boolean
  protocolToken: Asset | null
  transactions: Transaction[]
  contracts: GenericContract[]
  isVaultsPositionsLoaded: boolean
  portfolioTimestamp: number | null
  selectors: Record<string, Function>
  vaultsPositions: Record<string, VaultPosition>
  historicalRates: Record<AssetId, HistoryData[]>
  historicalPrices: Record<AssetId, HistoryData[]>
  historicalPricesUsd: Record<AssetId, HistoryData[]>
}

type VaultsOnchainData = {
  aprs: Balances
  balances: Balances
  assetsData: Assets
  pricesUsd: Balances
  rewards: VaultsRewards
  vaultsPrices: Balances
  totalSupplies: Balances
}

type ContextProps = InitialState

const initialState: InitialState = {
  aprs: {},
  vaults: [],
  rewards: {},
  balances: {},
  selectors: {},
  contracts: [],
  pricesUsd: {},
  assetsData: {},
  balancesUsd: {},
  vaultsPrices: {},
  transactions: [],
  totalSupplies: {},
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
    case 'SET_HISTORICAL_RATES':
      return {...state, historicalRates: action.payload}
    case 'SET_HISTORICAL_PRICES':
      return {...state, historicalPrices: action.payload}
    case 'SET_HISTORICAL_PRICES_USD':
      return {...state, historicalPricesUsd: action.payload}
    case 'SET_BALANCES':
      return {...state, balances: action.payload}
    case 'SET_REWARDS':
      return {...state, rewards: action.payload}
    case 'SET_BALANCES_USD':
      return {...state, balancesUsd: action.payload}
    case 'SET_VAULTS_PRICES':
      return {...state, vaultsPrices: action.payload}
    case 'SET_PRICES_USD':
      return {...state, pricesUsd: action.payload}
    case 'SET_TOTAL_SUPPLIES':
      return {...state, totalSupplies: action.payload}  
    case 'SET_ASSETS_DATA':
      return {...state, assetsData: action.payload}
    case 'SET_ASSETS_DATA_IF_EMPTY':
      if (!Object.keys(state.assetsData).length) {
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
    return state.vaults ? state.vaults.find( (vault: Vault) => vault.id.toLowerCase() === vaultId.toLowerCase()) || null : null
  }, [state.vaults])

  const selectAssetById = useCallback( (assetId: AssetId | undefined): Asset | null => {
    return assetId && state.assetsData ? state.assetsData[assetId.toLowerCase()] : null
  }, [state.assetsData])

  const selectVaultTransactions = useCallback( (vaultId: AssetId | undefined): Transaction[] | null => {
    return vaultId && state.transactions ? state.transactions[vaultId.toLowerCase()] : null
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
    if (!vault || !("gaugeConfig" in vault) || !vault.gaugeConfig) return null
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
    if (!state.totalSupplies || !assetId) return BNify(1)
    return state.totalSupplies[assetId.toLowerCase()] || BNify(1)
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

  const getUserTransactions = useCallback( async (startBlock: number): Promise<EtherscanTransaction[]> => {
    if (!account?.address || !explorer || !chainId) return []
    const cacheKey = `${explorer.endpoints[chainId]}?module=account&action=tokentx&address=${account.address}`
    const cachedData = cacheProvider && cacheProvider.getCachedUrl(cacheKey)

    startBlock = cachedData ? cachedData.data.reduce( (t: number, r: any) => Math.max(t, +r.blockNumber), 0)+1 : startBlock

    const endpoint = `${explorer.endpoints[chainId]}?module=account&action=tokentx&address=${account.address}&startblock=${startBlock}&endblock=latest&sort=asc`
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

    console.log('getUserTransactions', startBlock, cachedData, endpoint, etherscanTransactions, Array.from(dataToCache.values()))

    return Array.from(dataToCache.values()) as EtherscanTransaction[]
  }, [account?.address, explorer, chainId, cacheProvider])

  const getVaultsPositions = useCallback( async (vaults: Vault[]) => {

    if (!account?.address || !explorer || !chainId) return

    // const startTimestamp = Date.now()

    const startBlock = vaults.reduce( (startBlock: number, vault: Vault): number => {
      if (!("getBlockNumber" in vault)) return startBlock
      const vaultBlockNumber = vault.getBlockNumber()
      if (!startBlock) return vaultBlockNumber
      return Math.min(startBlock, vaultBlockNumber)
    }, 0)
    
    const etherscanTransactions = await getUserTransactions(startBlock)
    // console.log('etherscanTransactions', endpoint, etherscanTransactions)

    const vaultsTransactions: Record<string, Transaction[]> = await vaults.reduce( async (txsPromise: Promise<Record<string, Transaction[]>>, vault: Vault): Promise<Record<string, Transaction[]>> => {
      const txs = await txsPromise
      if (!("getTransactions" in vault)) return txs
      const vaultTransactions = await vault.getTransactions(account.address, etherscanTransactions)
      return {
        ...txs,
        [vault.id]: vaultTransactions
      }
    }, Promise.resolve({}))

    const vaultsPositions = Object.keys(vaultsTransactions).reduce( (vaultsPositions: Record<string, VaultPosition>, assetId: AssetId) => {
      const transactions = vaultsTransactions[assetId]

      if (!transactions || !transactions.length) return vaultsPositions

      let firstDepositTx: any = null
      const vaultPrice = selectVaultPrice(assetId)

      const depositsInfo = transactions.reduce( (depositsInfo: {balancePeriods: any[], depositedAmount: BigNumber}, transaction: Transaction, index: number) => {
        switch (transaction.action) {
          case 'deposit':
            if (!firstDepositTx){
              firstDepositTx = transaction
            }
            depositsInfo.depositedAmount = depositsInfo.depositedAmount.plus(transaction.underlyingAmount)
          break;
          case 'redeem':
            depositsInfo.depositedAmount = BigNumber.maximum(0, depositsInfo.depositedAmount.minus(transaction.underlyingAmount))
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
          lastBalancePeriod.realizedApr = lastBalancePeriod.earningsPercentage.times(31536000).div(lastBalancePeriod.duration)
          lastBalancePeriod.realizedApy = apr2apy(lastBalancePeriod.realizedApr).times(100)

          // console.log('Balance Period', assetId, dayjs(+lastBalancePeriod.timeStamp*1000).format('YYYY-MM-DD'), dayjs(+transaction.timeStamp*1000).format('YYYY-MM-DD'), lastBalancePeriod.idlePrice.toString(), transaction.idlePrice.toString(), lastBalancePeriod.balance.toString(), lastBalancePeriod.earningsPercentage.toString(), lastBalancePeriod.realizedApr.toString(), lastBalancePeriod.realizedApy.toString())
        }

        // Add period
        if (depositsInfo.depositedAmount.gt(0)){
          // Update period for last transactions
          const duration = index === transactions.length-1 ? Math.floor(Date.now()/1000)-(+transaction.timeStamp) : 0
          const earningsPercentage = duration ? vaultPrice.div(transaction.idlePrice).minus(1) : BNify(0)
          const realizedApr = duration ? earningsPercentage.times(31536000).div(duration) : BNify(0)
          const realizedApy = realizedApr ? apr2apy(realizedApr).times(100) : BNify(0)

          depositsInfo.balancePeriods.push({
            duration,
            realizedApy,
            realizedApr,
            earningsPercentage,
            idlePrice: transaction.idlePrice,
            timeStamp: +transaction.timeStamp,
            balance: depositsInfo.depositedAmount
          })

          // if (index === transactions.length-1) {
          //   console.log('Balance Period', assetId, dayjs(+transaction.timeStamp*1000).format('YYYY-MM-DD'), dayjs(Date.now()).format('YYYY-MM-DD'), transaction.idlePrice.toString(), vaultPrice.toString(), depositsInfo.depositedAmount.toString(), earningsPercentage.toString(), realizedApr.toString(), realizedApy.toString())
          // }
        }

        return depositsInfo
      }, {
        balancePeriods:[],
        depositedAmount: BNify(0)
      })

      const { balancePeriods, depositedAmount } = depositsInfo

      if (depositedAmount.lte(0)) return vaultsPositions

      let stakedAmount = BNify(0);
      let vaultBalance = selectAssetBalance(assetId)
      const assetPriceUsd = selectAssetPriceUsd(assetId)
      const depositDuration = firstDepositTx ? Math.round(Date.now() / 1000) - parseInt(firstDepositTx.timeStamp) : 0

      // Add gauge balance to vault balance
      const gauge = selectVaultGauge(assetId)
      if (gauge) {
        stakedAmount = selectAssetBalance(gauge.id)
        vaultBalance = vaultBalance.plus(stakedAmount)
      }

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

    return {
      vaultsPositions,
      vaultsTransactions
    }
  }, [account, explorer, chainId, selectVaultPrice, selectAssetPriceUsd, selectAssetBalance, selectVaultGauge, getUserTransactions])

  const getVaultsOnchainData = useCallback( async (vaults: Vault[], enabledCalls: string[] = []): Promise<VaultsOnchainData | null> => {
    if (!multiCall || !vaultFunctionsHelper) return null

    const checkEnabledCall = (call: string) => {
      return !enabledCalls.length || enabledCalls.includes(call)
    }

    const rawCalls = vaults.reduce( (rawCalls: CallData[][], vault: Vault): CallData[][] => {

      const aggregatedRawCalls = [
        account && checkEnabledCall('balances') ? vault.getBalancesCalls([account.address]) : [],
        ("getPricesCalls" in vault) && checkEnabledCall('vaultsPrices') ? vault.getPricesCalls() : [],
        ("getPricesUsdCalls" in vault) && checkEnabledCall('pricesUsd') ? vault.getPricesUsdCalls(state.contracts) : [],
        ("getAprsCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprsCalls() : [],
        ("getTotalSupplyCalls" in vault) && checkEnabledCall('totalSupplies') ? vault.getTotalSupplyCalls() : [],
        ("getFeesCalls" in vault) && checkEnabledCall('fees') ? vault.getFeesCalls() : [],
        ("getAprRatioCalls" in vault) && checkEnabledCall('aprRatio') ? vault.getAprRatioCalls() : [],
        ("getBaseAprCalls" in vault) && checkEnabledCall('baseApr') ? vault.getBaseAprCalls() : [],
        ("getProtocolsCalls" in vault) && checkEnabledCall('protocols') ? vault.getProtocolsCalls() : [],
        ("getRewardTokensCalls" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensCalls() : [],
        account && ("getRewardTokensAmounts" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensAmounts(account.address) : [],
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
      const assetKey = ("cdoConfig" in vault) ? vault.cdoConfig.address : vault.id
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

    // console.log('vaultsAdditionalBaseAprsPromises', vaultsAdditionalBaseAprsPromises)

    const [
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
        rewardTokensAmountsResults
      ]
    ] = await Promise.all([
      Promise.all(Array.from(vaultsAdditionalAprsPromises.values())),
      Promise.all(Array.from(vaultsAdditionalBaseAprsPromises.values())),
      Promise.all(Array.from(vaultsLastHarvestsPromises.values())),
      multiCall.executeMultipleBatches(rawCalls)
    ])

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

    const assetsData: Assets = {
      ...state.assetsData
    }

    // Process last harvest blocks
    ;(Object.values(vaultsLastHarvests) as CdoLastHarvest[]).forEach( (lastHarvest: CdoLastHarvest) => {
      const cdoId = lastHarvest.cdoId
      const filteredVaults = vaults.filter( (vault: Vault) => ("cdoConfig" in vault) && vault.cdoConfig.address === cdoId )
      filteredVaults.forEach( (vault: Vault) => {
        const assetId = vault.id

        assetsData[assetId] = {
          ...assetsData[assetId],
         lastHarvest: lastHarvest.harvest || null 
        }
        // dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { lastHarvest: lastHarvest.harvest || null } }})
      })
    })

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

    // console.log('allocationsResults', allocationsResults)

    // Process allocations
    const allocations: Record<AssetId, Balances> = {}
    allocationsResults?.forEach( (callResult: DecodedResult) => {
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
    })

    // console.log('allocations', allocations)

    // Set allocations
    Object.keys(allocations).forEach( (assetId: AssetId) => {
      assetsData[assetId] = {
        ...assetsData[assetId],
        allocations: allocations[assetId]
      }
    })

    // Process Apr Ratio
    aprRatioResults.forEach( (callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const trancheAPRSplitRatio = BNify(callResult.data.toString()).div(`1e03`)
          const aprRatio = asset.type === 'AA' ? trancheAPRSplitRatio : BNify(100).minus(trancheAPRSplitRatio)

          assetsData[assetId] = {
            ...assetsData[assetId],
            aprRatio
          }
        }
      }
    })

    // Process Rewards
    const rewards = rewardTokensAmountsResults.reduce( (rewards: VaultsRewards, callResult: DecodedResult): VaultsRewards => {
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
              if (!rewards[rewardId]){
                rewards[rewardId] = {
                  assets: [],
                  amount: BNify(0)
                }
              }
              rewards[rewardId].assets.push(assetId)
              rewards[rewardId].amount = rewards[rewardId].amount.plus(rewardAmount)
            }

            return {
              ...assetRewards,
              [rewardId]: rewardAmount
            }
          }, {})

          assetsData[assetId] = {
            ...assetsData[assetId],
            rewards: assetRewards
          }
        }
      }
      return rewards
    }, {})

    // Process Strategy Aprs
    baseAprResults.forEach( (callResult: DecodedResult) => {
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
          }

          assetsData[assetId] = {
            ...assetsData[assetId],
            baseApr
          }
        }
      }
    })

    // Process Fees
    feesCallsResults.forEach( (callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const fee = BNify(callResult.data.toString()).div(`1e05`)
          assetsData[assetId] = {
            ...assetsData[assetId],
            fee
          }
        }
      }
    })

    const balances = balanceCallsResults.reduce( (balances: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          balances[assetId] = BNify(callResult.data.toString()).div(`1e${asset.decimals}`)
          // console.log(`Balance ${asset.name}: ${balances[assetId].toString()}`)
          assetsData[assetId] = {
            ...assetsData[assetId],
            balance: balances[assetId]
          }
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
          assetsData[assetId] = {
            ...assetsData[assetId],
            vaultPrice: vaultsPrices[assetId]
          }
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
        assetsData[assetId] = {
          ...assetsData[assetId],
          priceUsd: pricesUsd[assetId]
        }

        if (asset.underlyingId){
          assetsData[asset.underlyingId] = {
            ...assetsData[asset.underlyingId],
            priceUsd: pricesUsd[asset.underlyingId]
          }
        }
      }
      return pricesUsd
    }, {})

    const aprs = aprsCallsResults.reduce( (aprs: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const vault = selectVaultById(assetId)
          const decimals = callResult.extraData.decimals || 18
          aprs[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)

          // Add additional Apr
          const vaultAdditionalApr: VaultAdditionalApr | undefined = vaultsAdditionalAprs.find( (apr: VaultAdditionalApr) => (apr.vaultId === assetId || (vault && "cdoConfig" in vault && apr.cdoId === vault.cdoConfig?.address)) )
          if (vaultAdditionalApr){
            aprs[assetId] = aprs[assetId].plus(vaultAdditionalApr.apr.div(`1e${decimals}`))
          }

          const apy = apr2apy(aprs[assetId].div(100)).times(100)

          // console.log(`Apr ${asset.name}: ${aprs[assetId].toString()}`)
          assetsData[assetId] = {
            ...assetsData[assetId],
            apr: aprs[assetId],
            apy
          }
        }
      }
      return aprs
    }, {})

    const totalSupplies = totalSupplyCallsResults.reduce( (totalSupplies: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          const decimals = callResult.extraData.decimals || asset.decimals
          totalSupplies[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)
          // console.log(`Total Supply ${asset.name} ${assetId}: ${totalSupplies[assetId].toString()} ${decimals}`)
          assetsData[assetId] = {
            ...assetsData[assetId],
            totalSupply: totalSupplies[assetId]
          }
        }
      }
      return totalSupplies
    }, {})

    // console.log('assetsData', assetsData)
    // Set assets data one time instead of updating for every asset

    // console.log('aprs', aprs)
    // console.log('balances', balances)
    // console.log('pricesUsd', pricesUsd)
    // console.log('vaultsPrices', vaultsPrices)
    // console.log('totalSupplies', totalSupplies)

    return {
      aprs,
      rewards,
      balances,
      pricesUsd,
      assetsData,
      vaultsPrices,
      totalSupplies
    }
  }, [selectAssetById, account, multiCall, selectVaultById, state.assetsData, state.contracts, vaultFunctionsHelper])

  // useEffect(() => {
  //   console.log('accountChanged', account, connecting, walletInitialized)
  // }, [account, connecting, walletInitialized])

  useEffect(() => {
    if (!protocolToken) return
    dispatch({type:'SET_PROTOCOL_TOKEN', payload: protocolToken})
  }, [protocolToken])

  // Update on-chain data of last transaction asset
  useEffect(() => {
    if (!lastTransaction || !state.isPortfolioLoaded) return
    if (!lastTransaction?.lastUpdated || lastTransaction.lastUpdated<state.portfolioTimestamp) return

    // console.log('lastTransaction', lastTransaction)
    const asset = selectAssetById(lastTransaction.assetId as string)
    const vault = selectVaultById(lastTransaction.assetId as string)

    if (!asset || asset.type === 'underlying' || !vault) return

    const vaults = [vault as Vault]
    if (("underlyingId" in asset) && asset.underlyingId){
      const underlyingVault = selectVaultById(asset.underlyingId)
      vaults.push(underlyingVault as Vault)
    }

    // console.log('Last Transaction Vault', vault)
    // console.log('Last Transaction Asset', asset)

    ;(async () => {
      const vaultsOnChainData = await getVaultsOnchainData(vaults);
      // console.log('Last Transaction Vault Data', vaultsOnChainData)
      if (!vaultsOnChainData) return

      const {
        aprs,
        rewards,
        balances,
        pricesUsd,
        assetsData,
        vaultsPrices,
        totalSupplies
      } = vaultsOnChainData

      const newAprs = {...state.aprs, ...aprs}
      const newRewards = {...state.rewards, ...rewards}
      const newBalances = {...state.balances, ...balances}
      const newPricesUsd = {...state.pricesUsd, ...pricesUsd}
      const newAssetsData = {...state.assetsData, ...assetsData}
      const newVaultsPrices = {...state.vaultsPrices, ...vaultsPrices}
      const newTotalSupplies = {...state.totalSupplies, ...totalSupplies}

      console.log('newBalances', newBalances)

      dispatch({type: 'SET_APRS', payload: newAprs})
      dispatch({type: 'SET_REWARDS', payload: newRewards})
      dispatch({type: 'SET_BALANCES', payload: newBalances})
      dispatch({type: 'SET_PRICES_USD', payload: newPricesUsd})
      dispatch({type: 'SET_ASSETS_DATA', payload: newAssetsData})
      dispatch({type: 'SET_VAULTS_PRICES', payload: newVaultsPrices})
      dispatch({type: 'SET_TOTAL_SUPPLIES', payload: newTotalSupplies})
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
      return vaultsContracts;
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
      return vaultsContracts;
    }, [])

    // Init best yield vaults
    const bestYieldVaults = Object.keys(bestYield[chainId]).reduce( (vaultsContracts: BestYieldVault[], token) => {
      const tokenConfig = bestYield[chainId][token]
      const trancheVault = new BestYieldVault({web3, web3Rpc, chainId, tokenConfig, type: 'BY', cacheProvider})
      vaultsContracts.push(trancheVault)
      return vaultsContracts;
    }, [])

    // Init gauges vaults
    const gaugesVaults = Object.keys(gauges).reduce( (vaultsContracts: GaugeVault[], token) => {
      const gaugeConfig = gauges[token]
      const trancheVault = trancheVaults.find( tranche => tranche.trancheConfig.address.toLowerCase() === gaugeConfig.trancheToken.address.toLowerCase() )

      const gaugeVault = new GaugeVault(web3, chainId, gaugeConfig, trancheVault)
      vaultsContracts.push(gaugeVault)
      return vaultsContracts;
    }, [])

    const allVaults = [...underlyingTokensVaults, ...trancheVaults, ...bestYieldVaults, ...gaugesVaults]
    
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
    };

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

    console.log('Check historicalPricesUsd', storedHistoricalPricesUsdLoaded, storedHistoricalPricesUsd)

    // Load 1 year by default
    let maxDays = 365

    // Prices are already stored
    if (!isEmpty(storedHistoricalPricesUsd) && storedHistoricalPricesUsd.timestamp){
      const daysDiff = dayDiff(Date.now(), storedHistoricalPricesUsd.timestamp)
      console.log('storedHistoricalPricesUsd', Date.now(), storedHistoricalPricesUsd.timestamp, daysDiff)
      if (!daysDiff){
        console.log('storedHistoricalPricesUsd', storedHistoricalPricesUsd.historicalPricesUsd)
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
      console.log('getChainlinkHistoricalPrices', maxDays, historicalPricesUsd)
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

      // Set assets data
      Object.keys(mergedHistoricalPricesUsd).forEach( (assetId: AssetId) => {
        const pricesUsd = mergedHistoricalPricesUsd[assetId]
        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { pricesUsd } }})
      })

      // Store and dispatch
      setHistoricalPricesUsd({
        timestamp: Date.now(),
        historicalPricesUsd: mergedHistoricalPricesUsd
      })

      console.log('historicalPricesCalls - DECODED', (Date.now()-startTimestamp)/1000, mergedHistoricalPricesUsd)

      dispatch({type: 'SET_HISTORICAL_PRICES_USD', payload: mergedHistoricalPricesUsd})
    })()
  // eslint-disable-next-line
  }, [state.vaults, web3, multiCall, storedHistoricalPricesUsdLoaded, getChainlinkHistoricalPrices])
  
  // Get historical vaults data
  useEffect(() => {

    if (isEmpty(state.vaults) || !state.isPortfolioLoaded || !isEmpty(state.historicalRates) /* || !walletInitialized || connecting*/) return

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
  }, [state.vaults, state.isPortfolioLoaded/*, walletInitialized, connecting*/])

  // Get tokens prices, balances, rates
  useEffect(() => {
    if (!state.vaults.length || !state.contracts.length || !multiCall || connecting || !walletInitialized) return
    // console.log('Make chain calls', account, state.vaults, state.contracts, multiCall, walletInitialized)

    // Avoid refreshing is disconnected
    if (!isEmpty(state.aprs) && !account?.address) {
      return dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
    }
    
    console.log('Loading Portfolio', account?.address, state.isPortfolioLoaded, state.aprs)

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

      const {
        aprs,
        rewards,
        balances,
        pricesUsd,
        assetsData,
        vaultsPrices,
        totalSupplies
      } = vaultsOnChainData

      // dispatch({type: 'SET_APRS', payload: aprs})
      // dispatch({type: 'SET_BALANCES', payload: balances})
      // dispatch({type: 'SET_PRICES_USD', payload: pricesUsd})
      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
      // dispatch({type: 'SET_VAULTS_PRICES', payload: vaultsPrices})
      // dispatch({type: 'SET_TOTAL_SUPPLIES', payload: totalSupplies})
      // dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
      
      // console.log('vaultsOnChainData', vaultsOnChainData)

      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        dispatch({type: 'SET_APRS', payload: {...state.aprs, ...aprs}})
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        dispatch({type: 'SET_REWARDS', payload: {...state.rewards, ...rewards}})
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        dispatch({type: 'SET_BALANCES', payload: {...state.balances, ...balances}})
      }
      if (!enabledCalls.length || enabledCalls.includes('pricesUsd')) {
        dispatch({type: 'SET_PRICES_USD', payload: {...state.pricesUsd, ...pricesUsd}})
      }
      if (!enabledCalls.length || enabledCalls.includes('vaultsPrices')) {
        dispatch({type: 'SET_VAULTS_PRICES', payload: {...state.vaultsPrices, ...vaultsPrices}})
      }
      if (!enabledCalls.length || enabledCalls.includes('totalSupplies')) {
        dispatch({type: 'SET_TOTAL_SUPPLIES', payload: {...state.totalSupplies, ...totalSupplies}})
      }

      // Always update assets data
      dispatch({type: 'SET_ASSETS_DATA', payload: {...state.assetsData, ...assetsData}})

      // Don't update 
      // if (!state.isPortfolioLoaded) {
        dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
      // }

      console.log('PORTFOLIO LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')    
    })()

    // Cleanup
    return () => {
      // dispatch({type: 'SET_APRS', payload: {}})
      dispatch({type: 'SET_REWARDS', payload: {}})
      dispatch({type: 'SET_BALANCES', payload: {}})
      // dispatch({type: 'SET_PRICES_USD', payload: {}})
      // dispatch({type: 'SET_VAULTS_PRICES', payload: {}})
      // dispatch({type: 'SET_TOTAL_SUPPLIES', payload: {}})
      dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})
      // console.log('RESET PORTFOLIO')
    };
  // eslint-disable-next-line
  }, [account, state.vaults, state.contracts, multiCall, walletInitialized])

  // Get user vaults positions
  useEffect(() => {
    if (!account?.address || !state.isPortfolioLoaded || !walletInitialized || connecting) return

    console.log('Load Vaults Positions', account?.address, state.isPortfolioLoaded, walletInitialized, connecting)

    ;(async () => {
      const results = await getVaultsPositions(state.vaults)
      if (!results) return

      const {
        vaultsPositions,
        vaultsTransactions
      } = results

      console.log('vaultsPositions', vaultsPositions)

      // Set asset data with vault position
      Object.keys(vaultsPositions).forEach( (assetId: AssetId) => {
        const vaultPosition = vaultsPositions[assetId]
        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { vaultPosition } }})
      })

      dispatch({type: 'SET_VAULTS_POSITIONS_LOADED', payload: true})
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions})
      dispatch({type: 'SET_VAULTS_TRANSACTIONS', payload: vaultsTransactions})
    })()

    // Clean transactions and positions
    return () => {
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: {}})
      dispatch({type: 'SET_VAULTS_TRANSACTIONS', payload: []})
      dispatch({type: 'SET_VAULTS_POSITIONS_LOADED', payload: false})
    };
  // eslint-disable-next-line
  }, [account, state.isPortfolioLoaded, state.portfolioTimestamp, walletInitialized, connecting])
  
  // Update balances USD
  useEffect(() => {

    if (!Object.values(state.balances).length || !Object.values(state.vaultsPositions).length) return

    const startTimestamp = Date.now();

    let totalBalanceUsd = BNify(0);
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

        // console.log('balancesUsd', assetId, vaultPosition, balancesUsd[assetId])

        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {balanceUsd: balancesUsd[assetId]} }})

        totalBalanceUsd = totalBalanceUsd.plus(balancesUsd[assetId])
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
  useEffect(() => {
    Object.keys(state.totalSupplies).forEach( assetId => {
      const asset = selectAssetById(assetId)
      if (asset) {
        const vaultPrice = selectVaultPrice(assetId)
        const assetPriceUsd = selectAssetPriceUsd(assetId)
        const assetTotalSupply = selectAssetTotalSupply(assetId)

        const tvl = assetTotalSupply.times(vaultPrice)
        const tvlUsd = tvl.times(assetPriceUsd)

        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {tvl, tvlUsd} }})
      }
    })
  // eslint-disable-next-line
  }, [state.totalSupplies, state.vaultsPrices, state.pricesUsd])

  return (
    <PortfolioProviderContext.Provider value={state}>
      {children}
    </PortfolioProviderContext.Provider>
  )
}
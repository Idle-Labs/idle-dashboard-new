import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { GaugeVault } from 'vaults/GaugeVault'
import useLocalForge from 'hooks/useLocalForge'
import { useWeb3Provider } from './Web3Provider'
import { TrancheVault } from 'vaults/TrancheVault'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { StakedIdleVault } from 'vaults/StakedIdleVault'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { explorers, networks } from 'constants/networks'
import { useCacheProvider } from 'contexts/CacheProvider'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { GenericContract } from 'contracts/GenericContract'
import { historicalPricesUsd } from 'constants/historicalData'
import type { CallData, DecodedResult } from 'classes/Multicall'
import type { CdoLastHarvest } from 'classes/VaultFunctionsHelper'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { selectUnderlyingToken, selectUnderlyingTokenByAddress } from 'selectors/'
import { SECONDS_IN_YEAR, STAKING_CHAINID, GOVERNANCE_CHAINID } from 'constants/vars'
import { createContext, useContext, useEffect, useMemo, useCallback, useReducer, useRef } from 'react'
import { VaultFunctionsHelper, ChainlinkHelper, FeedRoundBounds, GenericContractsHelper } from 'classes/'
import type { GaugeRewardData, GenericContractConfig, UnderlyingTokenProps, ContractRawCall, DistributedReward } from 'constants/'
import { globalContracts, bestYield, tranches, gauges, underlyingTokens, EtherscanTransaction, stkIDLE_TOKEN, PROTOCOL_TOKEN, MAX_STAKING_DAYS, IdleTokenProtocol } from 'constants/'
import { BNify, bnOrZero, makeEtherscanApiRequest, apr2apy, isEmpty, dayDiff, fixTokenDecimals, asyncReduce, avgArray, asyncWait, checkAddress, cmpAddrs, sendCustomEvent, asyncForEach, sortArrayByKey } from 'helpers/'
import type { ReducerActionTypes, VaultsRewards, Balances, StakingData, Asset, AssetId, Assets, Vault, Transaction, VaultPosition, VaultAdditionalApr, VaultHistoricalData, HistoryData, GaugeRewards, GaugesRewards, GaugesData, MaticNFT } from 'constants/types'

type VaultsPositions = {
  vaultsPositions: Record<AssetId, VaultPosition>
  vaultsTransactions: Record<AssetId, Transaction[]>
  distributedRewards: Record<AssetId, Asset["distributedRewards"]>
}

type VaultsOnchainData = {
  fees: Balances
  aprs: Balances
  limits: Balances
  baseAprs: Balances
  balances: Balances
  aprRatios: Balances
  pricesUsd: Balances
  maticNFTs: MaticNFT[]
  gaugesData: GaugesData
  vaultsPrices: Balances
  totalSupplies: Balances
  additionalAprs: Balances
  idleDistributions: Balances
  vaultsRewards: VaultsRewards
  // stakingData: StakingData | null
  rewards: Record<AssetId, Balances>
  allocations: Record<AssetId, Balances>
  pausedVaults: Record<AssetId, boolean>
  protocolsAprs: Record<AssetId, Balances>
  aprsBreakdown: Record<AssetId, Balances>
  interestBearingTokens: Record<AssetId, Balances>
  lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>
}

type InitialState = {
  vaults: Vault[]
  assetsData: Assets
  balancesUsd: Balances
  helpers: Record<any, any>
  vaultsChain: number | null
  isPortfolioLoaded: boolean
  protocolToken: Asset | null
  contracts: GenericContract[]
  gaugesRewards: GaugesRewards
  stakingData: StakingData | null
  isPortfolioAccountReady: boolean
  isVaultsPositionsLoaded: boolean
  portfolioTimestamp: number | null
  assetsDataTimestamp: number | null
  selectors: Record<string, Function>
  vaultsNetworks: Record<string, Vault[]>
  transactions: Record<string, Transaction[]>
  historicalTvls: Record<AssetId, HistoryData[]>
  vaultsPositions: Record<AssetId, VaultPosition>
  historicalRates: Record<AssetId, HistoryData[]>
  historicalPrices: Record<AssetId, HistoryData[]>
  historicalTvlsUsd: Record<AssetId, HistoryData[]>
  historicalPricesUsd: Record<AssetId, HistoryData[]>
  vaultsCollectedFees: Record<AssetId, Transaction[]>
  contractsNetworks: Record<string, GenericContract[]>
  distributedRewards: VaultsPositions["distributedRewards"]
} & VaultsOnchainData

type ContextProps = InitialState

const initialState: InitialState = {
  fees: {},
  aprs: {},
  limits: {},
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
  transactions: {},
  pausedVaults: {},
  stakingData: null,
  vaultsChain: null,
  totalSupplies: {},
  vaultsRewards: {},
  gaugesRewards: {},
  aprsBreakdown: {},
  protocolsAprs: {},
  additionalAprs: {},
  vaultsNetworks: {},
  historicalTvls: {},
  protocolToken: null,
  vaultsPositions: {},
  historicalRates: {},
  historicalPrices: {},
  idleDistributions: {},
  historicalTvlsUsd: {},
  contractsNetworks: {},
  distributedRewards: {},
  historicalPricesUsd: {},
  vaultsCollectedFees: {},
  isPortfolioLoaded: false,
  portfolioTimestamp: null,
  assetsDataTimestamp: null,
  interestBearingTokens: {},
  isPortfolioAccountReady: false,
  isVaultsPositionsLoaded: false
}

const initialContextState = initialState

const reducer = (state: InitialState, action: ReducerActionTypes) => {

  // console.log(action.type, action.payload)
  const currTime = Date.now()

  switch (action.type){
    case 'RESET_STATE':
      return {
        ...initialState,
        selectors: state.selectors
      }
    case 'SET_STATE':
      return {...state, ...action.payload}
    case 'SET_PROTOCOL_TOKEN':
      return {...state, protocolToken: action.payload}
    case 'SET_PORTFOLIO_TIMESTAMP':
      return {...state, portfolioTimestamp: action.payload}
    case 'SET_PORTFOLIO_LOADED':
      return {...state, isPortfolioLoaded: action.payload, portfolioTimestamp: currTime}
    case 'SET_PORTFOLIO_ACCOUNT_READY':
      return {...state, isPortfolioAccountReady: action.payload}
    case 'SET_VAULTS_POSITIONS_LOADED':
      return {...state, isVaultsPositionsLoaded: action.payload}
    case 'SET_SELECTORS':
      return {...state, selectors: action.payload}
    case 'SET_HELPERS':
      return {...state, helpers: action.payload}
    case 'SET_CONTRACTS':
      return {...state, contracts: action.payload}
    case 'SET_CONTRACTS_NETWORKS':
      return {...state, contractsNetworks: action.payload}
    case 'SET_VAULTS_TRANSACTIONS':
      return {...state, transactions: action.payload}
    case 'SET_VAULTS_POSITIONS':
      return {...state, vaultsPositions: action.payload}
    case 'SET_DISTRIBUTED_REWARDS':
      return {...state, distributedRewards: action.payload}
    case 'SET_VAULTS':
      return {...state, vaults: action.payload}
    case 'SET_VAULTS_CHAIN':
      return {...state, vaultsChain: action.payload}
    case 'SET_VAULTS_NETWORKS':
      return {...state, vaultsNetworks: action.payload}
    case 'SET_APRS':
      return {...state, aprs: action.payload}
    case 'SET_INTEREST_BEARING_TOKENS':
      return {...state, interestBearingTokens: action.payload}
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
    case 'SET_VAULTS_COLLECTED_FEES':
      return {...state, vaultsCollectedFees: action.payload}
    case 'SET_HISTORICAL_RATES':
      return {...state, historicalRates: action.payload}
    case 'SET_HISTORICAL_TVLS':
      return {...state, historicalTvls: action.payload}
    case 'SET_HISTORICAL_TVLS_USD':
      return {...state, historicalTvlsUsd: action.payload}
    case 'SET_ADDITIONAL_APRS':
      return {...state, additionalAprs: action.payload}
    case 'SET_PROTOCOLS_APRS':
      return {...state, protocolsAprs: action.payload}
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
      // console.log('Generate assets data', state.pricesUsd, action.payload['0xc8e6ca6e96a326dc448307a5fde90a0b21fd7f80'].priceUsd.toString(), currTime)
      return {...state, assetsData: action.payload, assetsDataTimestamp: currTime}
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

const PortfolioProviderContext = createContext<ContextProps>(initialContextState)

export const usePortfolioProvider = () => useContext(PortfolioProviderContext)

export function PortfolioProvider({ children }:ProviderProps) {
  const cacheProvider = useCacheProvider()
  const { environment } = useThemeProvider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { state: { lastTransaction } } = useTransactionManager()
  const { web3, web3Chains, web3Rpc, multiCall } = useWeb3Provider()
  const runningEffects = useRef<Record<string, boolean | number | string | undefined>>({})
  const { walletInitialized, connecting, account, prevAccount, chainId, prevChainId, explorer } = useWalletProvider()
  const [ storedHistoricalPricesUsd, setHistoricalPricesUsd, , storedHistoricalPricesUsdLoaded ] = useLocalForge('historicalPricesUsd', historicalPricesUsd)

  const accountChanged = useMemo(() => {
    return !!account && !!prevAccount && account.address !== prevAccount.address
  }, [account, prevAccount])

  const networkChanged = useMemo(() => {
    return !!chainId && !!prevChainId && +chainId !== +prevChainId
  }, [chainId, prevChainId])

  // console.log('accountChanged', accountChanged, 'chainId', chainId, 'prevChainId', prevChainId, 'networkChanged', networkChanged)

  const generateAssetsData = (vaults: Vault[]) => {
    const assetData = vaults.reduce( (assets: Assets, vault: Vault) => {
      const vaultAssetsData = vault.getAssetsData()
      const status = ("status" in vault) && vault.status ? vault.status : 'production'
      const chainId = +vault.chainId

      // Add assets IDs
      const vaultAssetsDataWithIds = Object.keys(vaultAssetsData).reduce( (vaultAssetsDataWithIds: Assets, assetId: AssetId) => {
        vaultAssetsDataWithIds[assetId] = {
          id: assetId,
          ...vaultAssetsData[assetId],
          status,
          chainId
        }
        return vaultAssetsDataWithIds
      }, {})

      return {...assets, ...vaultAssetsDataWithIds}
    },{})

    // console.log('assetData', vaults, assetData)

    return assetData
  }

  const selectVaultById = useCallback( (vaultId: AssetId | undefined): Vault | null => {
    return state.vaults ? state.vaults.find( (vault: Vault) => vault.id.toLowerCase() === vaultId?.toLowerCase()) || null : null
  }, [state.vaults])

  const selectVaultNetworkById = useCallback( (chainId: any, vaultId: AssetId | undefined): Vault | null => {
    return state.vaultsNetworks && state.vaultsNetworks[chainId] ? state.vaultsNetworks[chainId].find( (vault: Vault) => vault.id.toLowerCase() === vaultId?.toLowerCase()) || null : null
  }, [state.vaultsNetworks])

  const selectNetworkByVaultId = useCallback( (vaultId: AssetId): any | undefined => {
    return Object.keys(state.vaultsNetworks).find( (chainId: any) => {
      return state.vaultsNetworks[chainId].find( (vault: Vault) => vault.id.toLowerCase() === vaultId.toLowerCase() )
    })
  }, [state.vaultsNetworks])

  const selectAssetById = useCallback( (assetId: AssetId | undefined): Asset | null => {
    return assetId && state.assetsData ? state.assetsData[assetId.toLowerCase()] : null
  }, [state.assetsData])

  const selectVaultTransactions = useCallback( (vaultId: AssetId | undefined): Transaction[] => {
    return vaultId && state.transactions ? state.transactions[vaultId.toLowerCase()] || [] : []
  }, [state.transactions])

  const selectAssetStrategies = useCallback( (assetId: AssetId | undefined): string[] => {
    const vault = selectVaultById(assetId)
    
    if (vault instanceof TrancheVault) return [vault.type]
    if (!vault || !("tokenConfig" in vault) || !("protocols" in vault.tokenConfig)) return []
    
    return vault.tokenConfig.protocols.reduce( (availableStrategies: string[], protocolConfig: IdleTokenProtocol) => {
      const asset = selectAssetById(protocolConfig.address)
      if (!asset || !asset?.type) return availableStrategies
      if (availableStrategies.includes(asset.type)) return availableStrategies
      return [...availableStrategies, asset.type]
    }, [])
  }, [selectVaultById, selectAssetById])

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

  const selectAssetHistoricalTvls = useCallback( (assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalTvls[assetId.toLowerCase()] ? state.historicalTvls[assetId.toLowerCase()] : null
  }, [state.historicalTvls])

  const selectAssetHistoricalTvlsUsd = useCallback( (assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalTvlsUsd[assetId.toLowerCase()] ? state.historicalTvlsUsd[assetId.toLowerCase()] : null
  }, [state.historicalTvlsUsd])

  const selectAssetInterestBearingTokens = useCallback( (assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.interestBearingTokens[assetId.toLowerCase()] ? state.interestBearingTokens[assetId.toLowerCase()] : null
  }, [state.interestBearingTokens])

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
    const underlyingToken = selectUnderlyingToken(GOVERNANCE_CHAINID, PROTOCOL_TOKEN)
    return underlyingToken && selectAssetById(underlyingToken.address)
  }, [selectAssetById])

  const stkIDLEToken = useMemo(() => {
    if (!selectAssetById) return
    const underlyingToken = selectUnderlyingToken(STAKING_CHAINID, stkIDLE_TOKEN)
    return underlyingToken && selectAssetById(underlyingToken.token)
  }, [selectAssetById])

  const selectVaultsAssetsWithBalance = useCallback( (vaultType: string | null = null, includeStakedAmount = true): Asset[] | null => {
    const vaultsWithBalance = state.vaults ? state.vaults.filter( (vault: Vault) => {
      const assetBalance = selectAssetBalance(vault.id)
      const assetVaultPosition = selectVaultPosition(vault.id)
      const checkVaultType = vault.type !== 'underlying' && (!vaultType || vault.type.toLowerCase() === vaultType.toLowerCase())
      const vaultHasBalance = assetBalance.gt(0)
      const vaultHasStakedBalance = includeStakedAmount && BNify(assetVaultPosition?.underlying.staked).gt(0)
      return checkVaultType && (vaultHasBalance || vaultHasStakedBalance)
    }) : null
    return Object.keys(state.assetsData).filter( (assetId: AssetId) => vaultsWithBalance.map( (vault: Vault) => vault.id.toLowerCase() ).includes(assetId) ).map( (assetId: AssetId) => state.assetsData[assetId] )
  }, [state.vaults, state.assetsData, selectAssetBalance, selectVaultPosition])

  const vaultFunctionsHelper = useMemo((): VaultFunctionsHelper | null => {
    if (!chainId || !web3 || !multiCall || !explorer) return null
    return new VaultFunctionsHelper({chainId, web3, web3Chains, multiCall, explorer, cacheProvider})
  }, [chainId, web3, web3Chains, multiCall, explorer, cacheProvider])

  const genericContractsHelper = useMemo((): GenericContractsHelper | null => {
    if (!chainId || !web3 || !multiCall || !state.contracts.length) return null
    return new GenericContractsHelper({chainId, web3, multiCall, contracts: state.contracts})
  }, [chainId, web3, multiCall, state.contracts])

  const getUserTransactions = useCallback( async (startBlock: number, endBlock: string | number = 'latest', defaultChainId?: number, count = 0): Promise<EtherscanTransaction[]> => {
    if (!account?.address || !chainId) return []

    const chainIdToUse = defaultChainId ? +defaultChainId : +chainId

    const explorer = explorers[networks[chainIdToUse].explorer]
    if (!explorer) return []

    const cacheKey = `${explorer.endpoints[chainIdToUse]}?module=account&action=tokentx&address=${account.address}`
    const cachedData = cacheProvider && cacheProvider.getCachedUrl(cacheKey)

    startBlock = cachedData ? cachedData.data.reduce( (t: number, r: any) => Math.max(t, +r.blockNumber), 0)+1 : startBlock

    const endpoint = `${explorer.endpoints[chainIdToUse]}?module=account&action=tokentx&address=${account.address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc`
    const etherscanTransactions = await makeEtherscanApiRequest(endpoint, explorer.keys)

    const dataToCache = new Set()
    if (cachedData){
      for (const tx of cachedData.data) {
        dataToCache.add(tx)
      }
    }
    for (const tx of etherscanTransactions) {
      dataToCache.add(tx)
    }
      
    if (cacheProvider){
      cacheProvider.saveData(cacheKey, Array.from(dataToCache.values()), 0)
    }

    const userTransactions = Array.from(dataToCache.values()) as EtherscanTransaction[]

    // console.log('getUserTransactions', 'count', count, 'startBlock', startBlock, 'endBlock', endBlock, 'lastTransaction', lastTransaction, 'cachedData', cachedData, 'endpoint', endpoint, 'etherscanTransactions', etherscanTransactions, 'userTransactions', userTransactions)

    // Look for lastTransaction hash, otherwise wait and retry
    if (lastTransaction?.hash){
      const lastTransactionFound = userTransactions.find( (tx: EtherscanTransaction) => tx.hash.toLowerCase()===lastTransaction?.hash?.toLowerCase() )  
      if (!lastTransactionFound && count<=10){
        // console.log('lastTransaction hash NOT FOUND, wait 1s and try again, COUNT: ', count)
        await asyncWait(1000)
        return await getUserTransactions(startBlock, endBlock, chainIdToUse, count+1)
      }
    }

    return userTransactions
  }, [account?.address, lastTransaction, chainId, cacheProvider])

  const getVaultsPositions = useCallback( async (vaults: Vault[]): Promise<VaultsPositions> => {

    const output: VaultsPositions = {
      vaultsPositions: {},
      distributedRewards: {},
      vaultsTransactions: {}
    }

    if (!account?.address || !explorer || !web3Chains) return output

    const startTimestamp = Date.now()

    await asyncForEach(Object.keys(web3Chains), async (chainId: string) => {

      const chainVaults = vaults.filter( (vault: Vault) => +vault.chainId === +chainId )

      const startBlock = chainVaults.reduce( (startBlock: number, vault: Vault): number => {
        if (!("getBlockNumber" in vault)) return startBlock
        const vaultBlockNumber = vault.getBlockNumber()
        if (!startBlock) return vaultBlockNumber
        return Math.min(startBlock, vaultBlockNumber)
      }, 0)
        
      const endBlock = 'latest'
      const etherscanTransactions = await getUserTransactions(startBlock, endBlock, +chainId)
      // console.log('etherscanTransactions', account.address, startBlock, endBlock, etherscanTransactions)

      await asyncForEach(
        chainVaults,
        async (vault: Vault) => {
          if ("getTransactions" in vault){
            output.vaultsTransactions[vault.id] = await vault.getTransactions(account.address, etherscanTransactions)
          }
          if ("getDistributedRewards" in vault){
            const distributedRewardsTxs = vault.getDistributedRewards(account.address, etherscanTransactions)
            // console.log('distributedRewardsTxs', vault.id, distributedRewardsTxs)
            output.distributedRewards[vault.id] = distributedRewardsTxs.reduce( (distributedRewards: NonNullable<Asset["distributedRewards"]>, tx: EtherscanTransaction) => {
              const underlyingToken = selectUnderlyingTokenByAddress(+chainId, tx.contractAddress)
              if (!underlyingToken || !underlyingToken.address) return distributedRewards
              const underlyingTokenId = underlyingToken.address.toLowerCase()
              if (!distributedRewards[underlyingTokenId]){
                distributedRewards[underlyingTokenId] = []
              }
              const distributedReward: DistributedReward = {
                tx,
                apr: null,
                hash: tx.hash,
                chainId: +chainId,
                assetId: underlyingTokenId,
                blockNumber: +tx.blockNumber,
                timeStamp: +tx.timeStamp*1000,
                value: fixTokenDecimals(tx.value, underlyingToken.decimals || 18)
              }
              distributedRewards[underlyingTokenId].push(distributedReward)
              return distributedRewards
            }, {})
          }
        }
      )
    })

    output.vaultsPositions = Object.keys(output.vaultsTransactions).reduce( (vaultsPositions: Record<AssetId, VaultPosition>, assetId: AssetId) => {
      const transactions = output.vaultsTransactions[assetId]

      // console.log('transactions', assetId, transactions)

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

          // if (index === transactions.length-1){
          //   console.log('Balance Period', assetId, dayjs(+transaction.timeStamp*1000).format('YYYY-MM-DD'), lastBalancePeriod.duration, lastBalancePeriod.idlePrice.toString(), transaction.idlePrice.toString(), lastBalancePeriod.balance.toString(), lastBalancePeriod.earningsPercentage.toString(), lastBalancePeriod.realizedApr.toString(), lastBalancePeriod.realizedApy.toString(), transaction)
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
      const vaultTotalSupply = selectAssetTotalSupply(assetId)
      const depositDuration = firstDepositTx ? Math.round(Date.now() / 1000) - parseInt(firstDepositTx.timeStamp) : 0

      // Add gauge balance to vault balance
      const gauge = selectVaultGauge(assetId)
      if (gauge){
        stakedAmount = selectAssetBalance(gauge.id)
        vaultBalance = vaultBalance.plus(stakedAmount)
      }

      const poolShare = depositedIdleAmount.div(vaultTotalSupply)

      // console.log(assetId, depositedAmount.toString(), vaultBalance.toString(), vaultTotalSupply.toString())

      // Wait for balances to be loaded
      if (vaultBalance.lte(0)) return vaultsPositions

      // const realizedEarningsParams = balancePeriods.reduce( (realizedEarningsParams: {weight: BigNumber, sumAmount: BigNumber}, balancePeriod: any) => {
      //   const denom = balancePeriod.balance
      //   realizedEarningsParams.weight = realizedEarningsParams.weight.plus(balancePeriod.earningsPercentage.times(denom))
      //   realizedEarningsParams.sumAmount = realizedEarningsParams.sumAmount.plus(denom)
      //   return realizedEarningsParams
      // }, {
      //   weight: BNify(0),
      //   sumAmount: BNify(0)
      // })

      const realizedAprParams = balancePeriods.reduce( (realizedAprParams: {weight: BigNumber, sumAmount: BigNumber}, balancePeriod: any) => {
        const denom = BNify(balancePeriod.balance).times(balancePeriod.duration)
        realizedAprParams.weight = realizedAprParams.weight.plus(balancePeriod.realizedApr.times(denom))
        realizedAprParams.sumAmount = realizedAprParams.sumAmount.plus(denom)
        return realizedAprParams
      }, {
        weight: BNify(0),
        sumAmount: BNify(0)
      })

      // const realizedApyParams = balancePeriods.reduce( (realizedApyParams: {weight: BigNumber, sumAmount: BigNumber}, balancePeriod: any) => {
      //   const denom = balancePeriod.balance
      //   realizedApyParams.weight = realizedApyParams.weight.plus(balancePeriod.realizedApy.times(denom))
      //   realizedApyParams.sumAmount = realizedApyParams.sumAmount.plus(denom)
      //   return realizedApyParams
      // }, {
      //   weight: BNify(0),
      //   sumAmount: BNify(0)
      // })

      const realizedApr = realizedAprParams.weight.div(realizedAprParams.sumAmount)
      // const realizedApy = realizedApyParams.weight.div(realizedApyParams.sumAmount)
      const realizedApy = apr2apy(realizedApr).times(100)
      // const realizedEarnings = realizedEarningsParams.weight.div(realizedEarningsParams.sumAmount)

      const redeemableAmount = vaultBalance.times(vaultPrice)
      const earningsAmount = redeemableAmount.minus(depositedAmount)
      const earningsPercentage = redeemableAmount.div(depositedAmount).minus(1)
      const avgBuyPrice = BigNumber.maximum(1, vaultPrice.div(earningsPercentage.plus(1)))

      // const realizedApy2 = earningsPercentage && depositDuration ? apr2apy(earningsPercentage.times(31536000).div(depositDuration)).times(100) : BNify(0)
      // console.log('realizedApy', assetId, realizedAprParams.weight.toString(), realizedAprParams.sumAmount.toString(), realizedApr.toString(), realizedApy.toString())

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
        poolShare,
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

    // output.vaultsPositions = vaultsPositions
    // output.vaultsTransactions = vaultsTransactions
    // console.log('Load vaults positions', output)

    // eslint-disable-next-line
    console.log('VAULTS POSITIONS LOADED in', (Date.now()-startTimestamp)/1000)

    return output
  }, [account, explorer, web3Chains, selectVaultPrice, selectAssetTotalSupply, selectAssetPriceUsd, selectAssetBalance, selectVaultGauge, getUserTransactions])

  const getStkIdleCalls = useCallback((): CallData[] => {
    if (!web3 || !multiCall || !state.contractsNetworks?.[STAKING_CHAINID].length) return []
    
    const StkIdleContract = state.contractsNetworks[STAKING_CHAINID].find( (Contract: GenericContract) => Contract.name === 'stkIDLE')
    const StakingFeeDistributorContract = state.contractsNetworks[STAKING_CHAINID].find( (Contract: GenericContract) => Contract.name === 'StakingFeeDistributor')
    
    if (!StkIdleContract || !StakingFeeDistributorContract) return []

    return [
      multiCall.getCallData(StkIdleContract.contract, 'supply'),
      multiCall.getCallData(StkIdleContract.contract, 'totalSupply'),
      multiCall.getCallData(StkIdleContract.contract, 'locked', [account?.address]),
      multiCall.getCallData(StkIdleContract.contract, 'balanceOf', [account?.address]),
      multiCall.getCallData(StakingFeeDistributorContract.contract, 'claim', [account?.address])
    ].filter( (call): call is CallData => !!call )

  }, [account, web3, multiCall, state.contractsNetworks])

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
    if (!multiCall || !web3Chains || !vaultFunctionsHelper || !genericContractsHelper) return null

    const checkEnabledCall = (call: string) => {
      return !enabledCalls.length || enabledCalls.includes(call)
    }
    
    const rawCallsByChainId = vaults.filter( (vault: Vault) => checkAddress(vault.id) ).reduce( (rawCalls: Record<number, CallData[][]>, vault: Vault): Record<number, CallData[][]> => {
      const aggregatedRawCalls = [
        ("getPausedCalls" in vault) ? vault.getPausedCalls() : [],
        account && checkEnabledCall('balances') ? vault.getBalancesCalls([account.address]) : [],
        ("getPricesCalls" in vault) && checkEnabledCall('prices') ? vault.getPricesCalls() : [],
        ("getPricesUsdCalls" in vault) && checkEnabledCall('pricesUsd') ? vault.getPricesUsdCalls(state.contractsNetworks[+vault.chainId]) : [],
        ("getAprsCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprsCalls() : [],
        ("getTotalSupplyCalls" in vault) && checkEnabledCall('totalSupplies') ? vault.getTotalSupplyCalls() : [],
        ("getFeesCalls" in vault) && checkEnabledCall('fees') ? vault.getFeesCalls() : [],
        ("getLimitsCalls" in vault) && checkEnabledCall('limits') ? vault.getLimitsCalls() : [],
        ("getAprRatioCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprRatioCalls() : [],
        ("getBaseAprCalls" in vault) && checkEnabledCall('aprs') ? vault.getBaseAprCalls() : [],
        ("getProtocolsCalls" in vault) && checkEnabledCall('protocols') ? vault.getProtocolsCalls() : [],
        ("getInterestBearingTokensCalls" in vault) && checkEnabledCall('protocols') ? vault.getInterestBearingTokensCalls() : [],
        ("getInterestBearingTokensExchangeRatesCalls" in vault) && checkEnabledCall('protocols') ? vault.getInterestBearingTokensExchangeRatesCalls() : [],
      ]

      if (!rawCalls[vault.chainId])
        rawCalls[vault.chainId] = []

      aggregatedRawCalls.forEach( (calls: ContractRawCall[], index: number) => {
        // Init array index
        if (rawCalls[vault.chainId].length<=index){
          rawCalls[vault.chainId].push([])
        }

        calls.forEach( (rawCall: ContractRawCall) => {
          const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
          if (callData){
            rawCalls[vault.chainId][index].push(callData)
          }
        })
      })

      return rawCalls
    }, {})

    const mainnetRawCalls = vaults.filter( (vault: Vault) => checkAddress(vault.id) ).reduce( (mainnetRawCalls: CallData[][], vault: Vault): CallData[][] => {
      const aggregatedRawCalls = [
        ("getIdleDistributionCalls" in vault) && checkEnabledCall('aprs') ? vault.getIdleDistributionCalls() : [],
        ("getRewardTokensCalls" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensCalls() : [],
        account && ("getRewardTokensAmounts" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensAmounts(account.address) : [],
        ("getMultiRewardsDataCalls" in vault) && checkEnabledCall('rewards') ? vault.getMultiRewardsDataCalls() : [],
        ("getClaimableMultiRewardsCalls" in vault) && account && checkEnabledCall('balances') ? vault.getClaimableMultiRewardsCalls(account.address) : [],
        ("getClaimableRewardsCalls" in vault) && account && checkEnabledCall('balances') ? vault.getClaimableRewardsCalls(account.address) : [],
      ]

      aggregatedRawCalls.forEach( (calls: ContractRawCall[], index: number) => {
        // Init array index
        if (mainnetRawCalls.length<=index){
          mainnetRawCalls.push([])
        }

        calls.forEach( (rawCall: ContractRawCall) => {
          const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
          if (callData){
            mainnetRawCalls[index].push(callData)
          }
        })
      })

      return mainnetRawCalls
    }, [])

    // Add gauges calls
    const gaugesWeightsCalls = getGaugesCalls(vaults)
    if (gaugesWeightsCalls){
      gaugesWeightsCalls.map( (calls: CallData[]) => mainnetRawCalls.push(calls) )
    }

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

    // const stakedIdleVault = vaults.find( (vault: Vault) => vault.type === 'STK' ) as StakedIdleVault
    // const stakedIdleVaultRewardsPromise = vaultFunctionsHelper.getStakingRewards(stakedIdleVault)

    // Get Matic NFTs
    const maticNFTsPromise = checkEnabledCall('balances') && account?.address ? vaultFunctionsHelper.getMaticTrancheNFTs(account.address) : []

    // console.log('vaultsAdditionalBaseAprsPromises', vaultsAdditionalBaseAprsPromises)

    // const stkIdleCalls = getStkIdleCalls()
    // rawCalls.push(stkIdleCalls)
    
    // console.log('stkIdleCalls', stkIdleCalls)
    // console.log('rawCalls', rawCalls)

    const [
      maticNFTs,
      // stakedIdleVaultRewards,
      vaultsAdditionalAprs,
      vaultsAdditionalBaseAprs,
      vaultsLastHarvests,
      rawCallsResultsByChain,
      [
        idleDistributionResults,
        rewardTokensResults,
        rewardTokensAmountsResults,
        gaugeMultiRewardsData,
        gaugeClaimableMultiRewards,
        gaugeClaimableRewards,
        gaugesTimeWeights,
        // eslint-disable-next-line
        gaugesWeights,
        // eslint-disable-next-line
        gaugeTotalWeights,
        gaugesDistributionRate,
        // stkIdleResults
      ]
    ] = await Promise.all([
      maticNFTsPromise,
      // stakedIdleVaultRewardsPromise,
      Promise.all(Array.from(vaultsAdditionalAprsPromises.values())),
      Promise.all(Array.from(vaultsAdditionalBaseAprsPromises.values())),
      Promise.all(Array.from(vaultsLastHarvestsPromises.values())),
      Promise.all(Object.keys(rawCallsByChainId).map( chainId => multiCall.executeMultipleBatches(rawCallsByChainId[+chainId], +chainId, web3Chains[chainId]) )),
      // multiCall.executeMultipleBatches(rawCalls),
      multiCall.executeMultipleBatches(mainnetRawCalls, STAKING_CHAINID, web3Chains[STAKING_CHAINID]),
    ])

    let fees: Balances = {}
    let aprs: Balances = {}
    let limits: Balances = {}
    let baseAprs: Balances = {}
    let balances: Balances = {}
    let aprRatios: Balances = {}
    let pricesUsd: Balances = {}
    let vaultsPrices: Balances = {}
    let totalSupplies: Balances = {}
    let additionalAprs: Balances = {}
    let vaultsRewards: VaultsRewards = {}
    let rewards: Record<AssetId, Balances> = {}
    let allocations: Record<AssetId, Balances> = {}
    let pausedVaults: Record<AssetId, boolean> = {}
    let protocolsAprs: Record<AssetId, Balances> = {}
    let aprsBreakdown: Record<AssetId, Balances> = {}
    let interestBearingTokens: Record<AssetId, Balances> = {}
    let lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]> = {}

    Object.keys(rawCallsByChainId).forEach( (chainId, resultIndex) => {
      const [
        pausedCallsResults,
        balanceCallsResults,
        vaultsPricesCallsResults,
        pricesUsdCallsResults,
        aprsCallsResults,
        totalSupplyCallsResults,
        feesCallsResults,
        limitsCallsResults,
        aprRatioResults,
        baseAprResults,
        protocolsResults,
        interestBearingTokensCallsResults,
        interestBearingTokensExchangeRatesCallsResults,
      ]: DecodedResult[][] = rawCallsResultsByChain[resultIndex]
      // console.log('idleDistributionResults', idleDistributionResults, idleDistribution)

      // Process paused vaults
      pausedVaults = pausedCallsResults.reduce( (pausedVaults: Record<AssetId, boolean>, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        // console.log('idleDistribution', assetId, fixTokenDecimals(callResult.data.toString(), 18).toString())
        pausedVaults[assetId] = !!callResult.data
        return {
          ...pausedVaults,
          [assetId]: !!callResult.data
        }
      }, pausedVaults)

      // Process protocols Aprs
      protocolsAprs = protocolsResults.reduce( (protocolsAprs: Record<AssetId, Balances>, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          protocolsAprs[assetId] =  {}
          callResult.data[0].forEach( (protocolAddress: string, index: number) => {
            const protocolApr = fixTokenDecimals(callResult.data[1][index], 18)
            protocolsAprs[assetId][protocolAddress.toLowerCase()] = apr2apy(protocolApr.div(100)).times(100)
          })
        }
        return protocolsAprs
      }, protocolsAprs)

      // Prices Usd
      pricesUsd = pricesUsdCallsResults.reduce( (pricesUsd: Balances, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset){
          pricesUsd[assetId] = callResult.data ? callResult.extraData.params.processResults(callResult.data, callResult.extraData.params) : BNify(1)
        }
        return pricesUsd
      }, pricesUsd)

      // Process interest bearing tokens
      interestBearingTokens = interestBearingTokensCallsResults.reduce( (interestBearingTokens: Record<AssetId, Balances>, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          if (!interestBearingTokens[assetId]){
            interestBearingTokens[assetId] =  {}
          }

          const protocolAddress = callResult.extraData.data.address.toLowerCase()
          interestBearingTokens[assetId][protocolAddress] = fixTokenDecimals(callResult.data, callResult.extraData.data.decimals)

          const interestBearingTokensExchangeRateResult = interestBearingTokensExchangeRatesCallsResults.find( (callResult: DecodedResult) => {
            return cmpAddrs(callResult.extraData.data.address, protocolAddress)
          })

          if (interestBearingTokensExchangeRateResult){
            const exchangeRate = fixTokenDecimals(interestBearingTokensExchangeRateResult.data, interestBearingTokensExchangeRateResult.extraData.data.decimals)
            interestBearingTokens[assetId][protocolAddress] = interestBearingTokens[assetId][protocolAddress].times(exchangeRate)
          }
        }
        return interestBearingTokens
      }, interestBearingTokens)

      allocations = Object.keys(interestBearingTokens).reduce( (allocations: Record<AssetId, Balances>, assetId: AssetId) => {
        const assetTotalAllocation = Object.keys(interestBearingTokens[assetId]).reduce( (total: BigNumber, protocolAddress: AssetId) => {
          const underlyingToken = selectUnderlyingTokenByAddress(+chainId, protocolAddress)
          if (underlyingToken) return total
          return total.plus(interestBearingTokens[assetId][protocolAddress])
        }, BNify(0))

        allocations[assetId] = Object.keys(interestBearingTokens[assetId]).reduce( (assetAllocations: Balances, protocolAddress: AssetId) => {
          const allocationPercentage = BNify(interestBearingTokens[assetId][protocolAddress]).div(assetTotalAllocation).times(100)
          return {
            ...assetAllocations,
            [protocolAddress]: allocationPercentage
          }
        }, {})

        return allocations
      }, allocations)

      // console.log('allocations', allocations)
      // console.log('protocolsResults', protocolsResults)
      // console.log('allocationsResults', allocationsResults)
      // console.log('lastAllocationsCalls', lastAllocationsCalls)

      // Process Apr Ratio
      aprRatios = aprRatioResults.reduce( (aprRatios: Balances, callResult: DecodedResult) => {
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
      }, aprRatios)

      // Process Rewards
      rewards = rewardTokensAmountsResults.reduce( (rewards: Record<AssetId, Balances>, callResult: DecodedResult): Record<AssetId, Balances> => {
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
      }, rewards)

      // Process Strategy Aprs
      baseAprs = baseAprResults.reduce( (baseAprs: Balances, callResult: DecodedResult) => {
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
      }, baseAprs)

      // Process last harvest blocks
      lastHarvests = (Object.values(vaultsLastHarvests) as CdoLastHarvest[]).reduce( (lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>, lastHarvest: CdoLastHarvest) => {
        const cdoId = lastHarvest.cdoId
        const filteredVaults = vaults.filter( (vault: Vault) => ("cdoConfig" in vault) && vault.cdoConfig.address === cdoId )
        filteredVaults.forEach( (vault: Vault) => {
          const assetId = vault.id
          lastHarvests[assetId] = lastHarvest.harvest || null
        })

        return lastHarvests
      }, lastHarvests)

      aprs = aprsCallsResults.reduce( (aprs: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          const vault = selectVaultById(assetId)
          if (asset && vault){
            const decimals = callResult.extraData.decimals || 18
            aprs[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)

            aprsBreakdown[assetId] = {
              base: aprs[assetId]
            }

            // Add additional Apr
            const vaultAdditionalApr: VaultAdditionalApr | undefined = vaultsAdditionalAprs.find( (apr: VaultAdditionalApr) => (apr.vaultId === assetId) )
            if (vaultAdditionalApr && vaultAdditionalApr.apr.gt(0)){
              const additionalApr = vaultAdditionalApr.apr.div(`1e${decimals}`)
              // console.log(`Additional Apr ${asset.id}: ${vaultAdditionalApr.apr.toString()}, decimals ${decimals} => ${additionalApr.toString()}`)
              // console.log(`Additional Apr ${asset.name}: ${aprs[assetId].toString()} + ${additionalApr.toString()} = ${aprs[assetId].plus(additionalApr).toString()}`)
              aprs[assetId] = aprs[assetId].plus(additionalApr)

              // Add to base APR if no type
              if (!vaultAdditionalApr.type){
                aprsBreakdown[assetId].base = aprsBreakdown[assetId].base.plus(additionalApr)
              } else {
                aprsBreakdown[assetId][vaultAdditionalApr.type] = additionalApr
              }
            }

            additionalAprs[assetId] = BNify(0)

            // Add harvest apr
            const addHarvestApy = !("flags" in vault) || vault.flags?.addHarvestApy === undefined || vault.flags.addHarvestApy
            if (lastHarvests[assetId] && addHarvestApy) {
              additionalAprs[assetId] = additionalAprs[assetId].plus(BNify(lastHarvests[assetId]?.aprs[vault.type]).times(100))
              // console.log(`Additional Apr ${asset.name}: ${aprs[assetId].toString()} + ${additionalAprs[assetId].toString()} = ${aprs[assetId].plus(additionalAprs[assetId]).toString()}`)
              aprs[assetId] = aprs[assetId].plus(additionalAprs[assetId])
              aprsBreakdown[assetId].harvest = additionalAprs[assetId]

              const harvestDays = dayDiff((lastHarvests[assetId]?.timestamp!)*1000, Date.now())

              // Reset harvest APY if base APY is zero
              if (aprsBreakdown[assetId].base.lte(0) && harvestDays>1){
                aprsBreakdown[assetId].harvest = BNify(0)
              }
            }
          }
        }
        return aprs
      }, aprs)

      // Process Fees
      fees = feesCallsResults.reduce( (fees: Balances, callResult: DecodedResult) => {
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
      }, fees)

      // Process Limits
      limits = limitsCallsResults.reduce( (limits: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset){
            const decimals = callResult.extraData.decimals || asset.decimals
            const limit = BNify(callResult.data.toString()).div(`1e${decimals}`)
            limits[assetId] = limit
          }
        }
        return limits
      }, {})

      balances = balanceCallsResults.reduce( (balances: Balances, callResult: DecodedResult) => {
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
      }, balances)

      vaultsPrices = vaultsPricesCallsResults.reduce( (vaultsPrices: Balances, callResult: DecodedResult) => {
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
      }, vaultsPrices)

      // console.log('vaultsPrices', vaultsPrices)

      totalSupplies = totalSupplyCallsResults.reduce( (totalSupplies: Balances, callResult: DecodedResult) => {
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
      }, totalSupplies)

    })

    // Process idle distribution
    const idleDistributions = idleDistributionResults.reduce( (idleDistributions: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        // console.log('idleDistribution', assetId, fixTokenDecimals(callResult.data.toString(), 18).toString())
        idleDistributions[assetId] = fixTokenDecimals(callResult.data.toString(), 18)
      }
      return idleDistributions
    }, {})

    // Process Gauges data
    const gaugesRelativeWeights: Record<string, DecodedResult[]> | null = gaugesTimeWeights ? await genericContractsHelper.getGaugesRelativeWeights(gaugesTimeWeights) : {}
    
    const gaugesData = gaugesRelativeWeights?.weights ? gaugesRelativeWeights.weights.reduce( (gaugesData: GaugesData, callResult: DecodedResult) => {
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
              const apr = gaugeVault.enabled ? yearRewardsUsd.div(gaugePoolUsd).times(100) : BNify(0)
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

    // console.log('vaultsOnChainData', {
    //   fees,
    //   aprs,
    //   rewards,
    //   balances,
    //   baseAprs,
    //   pricesUsd,
    //   aprRatios,
    //   maticNFTs,
    //   // assetsData,
    //   gaugesData,
    //   // stakingData,
    //   allocations,
    //   lastHarvests,
    //   vaultsPrices,
    //   pausedVaults,
    //   totalSupplies,
    //   aprsBreakdown,
    //   protocolsAprs,
    //   vaultsRewards,
    //   additionalAprs,
    //   idleDistributions,
    //   interestBearingTokens
    // })

    return {
      fees,
      aprs,
      limits,
      rewards,
      balances,
      baseAprs,
      pricesUsd,
      aprRatios,
      maticNFTs,
      // assetsData,
      gaugesData,
      // stakingData,
      allocations,
      lastHarvests,
      vaultsPrices,
      pausedVaults,
      totalSupplies,
      aprsBreakdown,
      protocolsAprs,
      vaultsRewards,
      additionalAprs,
      idleDistributions,
      interestBearingTokens
    }
  }, [selectAssetById, web3Chains, account, multiCall, selectVaultById, state.contractsNetworks, genericContractsHelper, vaultFunctionsHelper, getGaugesCalls, selectAssetPriceUsd, selectAssetTotalSupply, selectVaultPrice])

  useEffect(() => {
    if (!protocolToken) return
    dispatch({type:'SET_PROTOCOL_TOKEN', payload: protocolToken})
  }, [protocolToken])

  // Clear running effects on network changed
  useEffect(() => {
    if (!networkChanged) return
    runningEffects.current = {}
    dispatch({type: 'RESET_STATE', payload: {}})
    // console.log('NETWORK CHANGED - RESET STATE');
  }, [networkChanged])

  // Clear portfolio when wallet changed
  useEffect(() => {
    if (!account && !!prevAccount){
      // console.log('ACCOUNT CHANGED - RESET STATE')
      dispatch({type: 'RESET_STATE', payload: {}})
    }
  }, [account, prevAccount])

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

    (async () => {
      // console.log('Update vaults after transaction', lastTransaction, vaults)
      const vaultsOnChainData = await getVaultsOnchainData(vaults);
      if (!vaultsOnChainData) return
      // console.log('getVaultsOnchainData', vaultsOnChainData)

      const {
        fees,
        aprs,
        limits,
        rewards,
        balances,
        baseAprs,
        pricesUsd,
        aprRatios,
        maticNFTs,
        gaugesData,
        allocations,
        // stakingData,
        lastHarvests,
        pausedVaults,
        vaultsPrices,
        totalSupplies,
        protocolsAprs,
        aprsBreakdown,
        // vaultsRewards,
        additionalAprs,
        idleDistributions,
        interestBearingTokens
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

      const newPausedVaults = vaults.map( (vault: Vault) => vault.id ).reduce( (newPausedVaults: Record<AssetId, boolean>, vaultId: AssetId) => {
        if (!pausedVaults[vaultId]){
          newPausedVaults[vaultId] = false
          return newPausedVaults
        }
        return {
          ...newPausedVaults,
          [vaultId]: pausedVaults[vaultId]
        }
      }, {...state.pausedVaults})

      const newIdleDistributions = vaults.map( (vault: Vault) => vault.id ).reduce( (newIdleDistributions: Balances, vaultId: AssetId) => {
        if (!idleDistributions[vaultId]){
          newIdleDistributions[vaultId] = BNify(0)
          return newIdleDistributions
        }
        return {
          ...newIdleDistributions,
          [vaultId]: idleDistributions[vaultId]
        }
      }, {...state.idleDistributions})

      const newProtocolsAprs = vaults.map( (vault: Vault) => vault.id ).reduce( (newProtocolsAprs: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!protocolsAprs[vaultId]){
          delete newProtocolsAprs[vaultId]
          return newProtocolsAprs
        }
        return {
          ...newProtocolsAprs,
          [vaultId]: protocolsAprs[vaultId]
        }
      }, {...state.protocolsAprs})

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

      const newLimits = vaults.map( (vault: Vault) => vault.id ).reduce( (newLimits: Balances, vaultId: AssetId) => {
        if (!limits[vaultId]){
          newLimits[vaultId] = BNify(0)
          return newLimits
        }
        return {
          ...newLimits,
          [vaultId]: limits[vaultId]
        }
      }, {...state.limits})

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

      const newInterestBearingTokens = vaults.map( (vault: Vault) => vault.id ).reduce( (newInterestBearingTokens: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!interestBearingTokens[vaultId]){
          delete newInterestBearingTokens[vaultId]
          return newInterestBearingTokens
        }
        return {
          ...newInterestBearingTokens,
          [vaultId]: interestBearingTokens[vaultId]
        }
      }, {...state.interestBearingTokens})

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

      const newState: any = {
        maticNFTs,
        gaugesData,
        // stakingData,
        fees: newFees,
        aprs: newAprs,
        limits: newLimits,
        rewards: newRewards,
        balances: newBalances,
        baseAprs: newBaseAprs,
        aprRatios: newAprRatios,
        pricesUsd: newPricesUsd,
        allocations: newAllocations,
        pausedVaults: newPausedVaults,
        lastHarvests: newLastHarvests,
        vaultsPrices: newVaultsPrices,
        protocolsAprs: newProtocolsAprs,
        vaultsRewards: newVaultsRewards,
        aprsBreakdown: newAprsBreakdown,
        totalSupplies: newTotalSupplies,
        additionalAprs: newAdditionalAprs,
        idleDistributions: newIdleDistributions,
        interestBearingTokens: newInterestBearingTokens
      }

      dispatch({type: 'SET_STATE', payload: newState})
      /*
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
      */
      dispatch({type: 'SET_PORTFOLIO_TIMESTAMP', payload: Date.now()})
    })()

  // eslint-disable-next-line
  }, [lastTransaction, state.isPortfolioLoaded])

  // Init underlying tokens and vaults contracts
  useEffect(() => {
    if (!web3 || !web3Chains || !chainId || !cacheProvider?.isLoaded) return

    // Init global contracts
    const contracts = globalContracts[chainId].map( (contract: GenericContractConfig) => {
      return new GenericContract(web3, chainId, contract)
    })

    const contractsNetworks = Object.keys(web3Chains).reduce( (contractsNetworks: Record<string, GenericContract[]>, chainId: any) => {
      if (!globalContracts[chainId]) return contractsNetworks
      contractsNetworks[chainId] = globalContracts[chainId].map( (contract: GenericContractConfig) => {
        return new GenericContract(web3Chains[chainId], chainId, contract)
      })
      return contractsNetworks
    }, {})

    const checkVaultEnv = (vaultConfig: any) => {
      if (!("enabledEnvs" in vaultConfig)) return true
      if (("enabledEnvs" in vaultConfig) && !vaultConfig.enabledEnvs.length) return true
      if (("enabledEnvs" in vaultConfig) && vaultConfig.enabledEnvs.includes(environment)) return true
      return false
    }

    // Init all vaults networks
    const allVaultsNetworks: Record<string, Vault[]> = {}

    // Init underlying tokens vaults
    const underlyingTokensVaults: UnderlyingToken[] = []
    Object.keys(web3Chains).forEach( (vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]){
        allVaultsNetworks[vaultChainId] = []
      }

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]

      Object.keys(underlyingTokens[vaultChainId]).forEach( token => {
        const tokenConfig = underlyingTokens[vaultChainId][token]
        if (tokenConfig) {
          const underlyingToken = new UnderlyingToken(web3ToUse, vaultChainId, tokenConfig)
          allVaultsNetworks[vaultChainId].push(underlyingToken)
          underlyingTokensVaults.push(underlyingToken)
        }
      })
    })

    // const underlyingTokensVaults: UnderlyingToken[] = underlyingTokensVaultsNetworks[chainId]

    // Init tranches vaults
    const trancheVaults: TrancheVault[] = []
    Object.keys(web3Chains).forEach( (vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]){
        allVaultsNetworks[vaultChainId] = []
      }

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]
      const web3RpcToUse = +vaultChainId === +chainId ? web3Rpc : web3Chains[vaultChainId]

      Object.keys(tranches[vaultChainId]).forEach( protocol => {
        Object.keys(tranches[vaultChainId][protocol]).forEach( token => {
          const vaultConfig = tranches[vaultChainId][protocol][token]
          if (checkVaultEnv(vaultConfig)){
            const gaugeConfig = Object.values(gauges).find( gaugeConfig => gaugeConfig.trancheToken.address.toLowerCase() === vaultConfig.Tranches.AA.address.toLowerCase() )
            const trancheVaultAA = new TrancheVault({web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, protocol, vaultConfig, gaugeConfig, type: 'AA', cacheProvider})
            const trancheVaultBB = new TrancheVault({web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, protocol, vaultConfig, gaugeConfig: null, type: 'BB', cacheProvider})
            allVaultsNetworks[vaultChainId].push(trancheVaultAA)
            allVaultsNetworks[vaultChainId].push(trancheVaultBB)
            trancheVaults.push(trancheVaultAA)
            trancheVaults.push(trancheVaultBB)
          }
        })
      })
    })

    // const trancheVaults: TrancheVault[] = trancheVaultsNetworks[chainId]

    const idleController = contracts.find(c => c.name === 'IdleController')

    // Init best yield vaults
    const bestYieldVaults: BestYieldVault[] = []
    Object.keys(web3Chains).forEach( (vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]){
        allVaultsNetworks[vaultChainId] = []
      }

      if (!bestYield[vaultChainId]) return

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]
      const web3RpcToUse = +vaultChainId === +chainId ? web3Rpc : web3Chains[vaultChainId]

      Object.keys(bestYield[vaultChainId]).forEach( token => {
        const tokenConfig = bestYield[vaultChainId][token]
        if (checkVaultEnv(tokenConfig)){
          const bestYieldVault = new BestYieldVault({web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, tokenConfig, type: 'BY', cacheProvider, idleController})
          allVaultsNetworks[vaultChainId].push(bestYieldVault)
          bestYieldVaults.push(bestYieldVault)
        }
      })
    })

    // const bestYieldVaults: BestYieldVault[] = bestYieldVaultsNetworks[chainId]

    const gaugeDistributorProxy = contracts.find(c => c.name === 'GaugeDistributorProxy')

    // Init gauges vaults
    const gaugesVaults: GaugeVault[] = Object.keys(gauges).reduce( (vaultsContracts: GaugeVault[], token) => {
      const gaugeConfig = gauges[token]
      const trancheVault = trancheVaults.find( tranche => tranche.trancheConfig.address.toLowerCase() === gaugeConfig.trancheToken.address.toLowerCase() )
      if (!trancheVault) return vaultsContracts
      const gaugeVault = new GaugeVault({web3, chainId, gaugeConfig, trancheVault, cacheProvider, gaugeDistributorProxy})
      vaultsContracts.push(gaugeVault)
      allVaultsNetworks[chainId].push(gaugeVault)
      return vaultsContracts
    }, [])

    // Init stkIDLE vault
    const rewardTokenConfig = selectUnderlyingToken(STAKING_CHAINID, PROTOCOL_TOKEN) as UnderlyingTokenProps
    const stkIdleConfig = globalContracts[STAKING_CHAINID].find( (contract: GenericContractConfig) => contract.name === 'stkIDLE' ) as GenericContractConfig
    const feeDistributorConfig = globalContracts[STAKING_CHAINID].find( (contract: GenericContractConfig) => contract.name === 'StakingFeeDistributor' ) as GenericContractConfig

    // console.log('stakedIdleVault', stakedIdleVault)
    // console.log('allVaultsNetworks', allVaultsNetworks)

    const allVaults: Vault[] = [...underlyingTokensVaults, ...trancheVaults, ...bestYieldVaults, ...gaugesVaults]

    if (stkIdleConfig){

      const defaultChainWeb3 = +chainId === +STAKING_CHAINID ? web3 : web3Chains[STAKING_CHAINID]

      const stakedIdleVault: StakedIdleVault = new StakedIdleVault({web3: defaultChainWeb3, chainId: STAKING_CHAINID, rewardTokenConfig, stkIdleConfig, feeDistributorConfig})
      allVaults.push(stakedIdleVault)
      allVaultsNetworks[STAKING_CHAINID].push(stakedIdleVault)

      // Add staking reward token
      if (+STAKING_CHAINID !== +chainId){
        const rewardUnderlyingToken = new UnderlyingToken(defaultChainWeb3, STAKING_CHAINID, rewardTokenConfig)
        allVaults.push(rewardUnderlyingToken)
        allVaultsNetworks[STAKING_CHAINID].push(rewardUnderlyingToken)

        const stkIDLEUnderlyingTokenConfig = selectUnderlyingToken(STAKING_CHAINID, stkIDLE_TOKEN) as UnderlyingTokenProps
        const stkIDLEUnderlyingToken = new UnderlyingToken(defaultChainWeb3, STAKING_CHAINID, stkIDLEUnderlyingTokenConfig)
        allVaults.push(stkIDLEUnderlyingToken)
        allVaultsNetworks[STAKING_CHAINID].push(stkIDLEUnderlyingToken)
      }
    }

    // console.log('allVaults', chainId, allVaults)
    
    const assetsData = generateAssetsData(allVaults)
    dispatch({type: 'SET_VAULTS', payload: allVaults})
    dispatch({type: 'SET_CONTRACTS', payload: contracts})
    dispatch({type: 'SET_VAULTS_CHAIN', payload: chainId})
    dispatch({type: 'SET_ASSETS_DATA_IF_EMPTY', payload: assetsData})
    dispatch({type: 'SET_VAULTS_NETWORKS', payload: allVaultsNetworks})
    dispatch({type: 'SET_CONTRACTS_NETWORKS', payload: contractsNetworks})

    // Cleanup
    return () => {
      // dispatch({type: 'SET_VAULTS', payload: []})
      // dispatch({type: 'SET_CONTRACTS', payload: []})
      // const assetsData = generateAssetsData(allVaults)
      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
    };

  // eslint-disable-next-line
  }, [web3, web3Rpc, web3Chains, chainId, environment, cacheProvider?.isLoaded])

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
      selectAssetStrategies,
      selectAssetBalanceUsd,
      selectNetworkByVaultId,
      selectVaultNetworkById,
      selectVaultTransactions,
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectAssetHistoricalTvls,
      selectAssetHistoricalRates,
      selectAssetHistoricalPrices,
      selectAssetHistoricalTvlsUsd,
      selectVaultsAssetsWithBalance,
      selectAssetInterestBearingTokens,
      selectAssetHistoricalPriceByTimestamp,
      selectAssetHistoricalPriceUsdByTimestamp
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
    selectAssetStrategies,
    selectAssetBalanceUsd,
    selectNetworkByVaultId,
    selectVaultNetworkById,
    selectVaultTransactions,
    selectVaultsWithBalance,
    selectVaultsAssetsByType,
    selectAssetHistoricalTvls,
    selectAssetHistoricalRates,
    selectAssetHistoricalPrices,
    selectAssetHistoricalTvlsUsd,
    selectVaultsAssetsWithBalance,
    selectAssetInterestBearingTokens,
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

  const getChainlinkHistoricalPrices = useCallback(async (vaults: Vault[], maxDays = 365): Promise<Record<AssetId, HistoryData[]> | undefined> => {

    if (!web3 || !multiCall || !web3Chains) return

    const chainlinkHelper: ChainlinkHelper = new ChainlinkHelper(1, web3Chains[1], multiCall)

    // Get assets chainlink feeds
    const vaultsUnderlyingTokens = vaults.reduce( ( assets: Record<AssetId, UnderlyingTokenProps>, vault: Vault): Record<AssetId, UnderlyingTokenProps> => {
      if (!("underlyingToken" in vault) || !vault.underlyingToken || +vault.chainId !== 1) return assets
      const underlyingTokenAddress = vault.underlyingToken?.address?.toLowerCase()
      if (underlyingTokenAddress && !assets[underlyingTokenAddress]) {
        assets[underlyingTokenAddress] = vault.underlyingToken
      }
      // Add reward tokens
      if (vault.rewardTokens.length){
        vault.rewardTokens.forEach( (rewardUnderlyingToken: UnderlyingTokenProps) => {
          if (rewardUnderlyingToken.address){
            assets[rewardUnderlyingToken.address] = rewardUnderlyingToken
          }
        })
      }
      return assets
    }, {})
    
    // TODO: Get historical USD conversion rates for other chains than ethereum mainnet
    // return Object.keys(vaultsUnderlyingTokens).reduce( (historicalPricesUsd: Record<AssetId, HistoryData[]>, assetId: AssetId) => {
    //   return {
    //     ...historicalPricesUsd,
    //     [assetId]: []
    //   }
    // }, {})

    const feedsCalls = Object.keys(vaultsUnderlyingTokens).reduce( (calls: CallData[][], assetId: AssetId): CallData[][] => {
      const underlyingToken = vaultsUnderlyingTokens[assetId]
      const address = underlyingToken.chainlinkPriceFeed?.address || assetId

      const rawCallUsd = chainlinkHelper.getUsdFeedAddressRawCall(address, assetId)
      const callDataUsd = rawCallUsd && multiCall && multiCall.getDataFromRawCall(rawCallUsd.call, rawCallUsd)
      if (callDataUsd) calls[0].push(callDataUsd)

      return calls
    }, [[],[]])

    // console.log('feedsCalls', feedsCalls)

    const [
      feedsUsd
    // @ts-ignore
    ] = await multiCall.executeMultipleBatches(feedsCalls, 1, web3Chains[1])

    // console.log('feedsUsd', feedsUsd)

    // Group feeds by asset
    const assetsFeedsUsd = feedsUsd.reduce( (assetsFeedsUsd: Record<AssetId, string | null>, callResult: DecodedResult): Record<AssetId, string | null> => {
      const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
      const underlyingToken = vaultsUnderlyingTokens[assetId]
      const feedAddress = callResult.data || underlyingToken.chainlinkPriceFeed?.feedUsdAddress
      if (!feedAddress) return assetsFeedsUsd // Feed not found
      return {
        ...assetsFeedsUsd,
        [assetId]: feedAddress
      }
    }, {})

    // console.log('assetsFeedsUsd', assetsFeedsUsd)

    // Get feeds rounds bounds (timestamp, latestRound, latestTimestamp)
    const feedsUsdRoundBoundsCalls = Object.keys(assetsFeedsUsd).reduce( (calls: CallData[][], assetId: string) => {
      const feedUsdAddress = assetsFeedsUsd[assetId]
      if (!feedUsdAddress || !multiCall) return calls
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
    // @ts-ignore
    ] = await multiCall.executeMultipleBatches(feedsUsdRoundBoundsCalls, 1, web3Chains[1])

    // console.log('feedsUsdRoundBoundsResults', feedsUsdTimestampResults, feedsUsdLatestRoundResults, feedsUsdLatestTimestampResults)

    // const pastRoundsCalls = Array.from(Array(feedsUsdTimestampResults.length).keys()).reduce( (pastRoundsCalls: ContractRawCall[], callIndex: number): ContractRawCall[] => {
    //   const { data: latestRound } = feedsUsdLatestRoundResults[callIndex]
    //   const assetId = feedsUsdTimestampResults[callIndex].extraData.assetId?.toString() || feedsUsdTimestampResults[callIndex].callData.target.toLowerCase()
    //   const feedUsdAddress = assetsFeedsUsd[assetId] as string
    //   pastRoundsCalls.push(chainlinkHelper.getRoundDataCall(assetId, feedUsdAddress, latestRound-10))
    //   return pastRoundsCalls
    // }, []);

    // const pastRoundsResults = await multiCall.executeMulticalls(multiCall.getCallsFromRawCalls(pastRoundsCalls), true, 1, web3Chains[1])
    // console.log('pastRoundsResults', pastRoundsResults)

    // Generate assets usd feeds rounds bounds (latestRound, firstTimestamp, latestTimestamp)
    const feedsUsdRoundBounds = Array.from(Array(feedsUsdTimestampResults.length).keys()).reduce( (feedsUsdRoundBounds: Record<AssetId, FeedRoundBounds>, callIndex: number): Record<AssetId, FeedRoundBounds> => {
      const { data: firstTimestamp } = feedsUsdTimestampResults[callIndex]
      const { data: latestRound } = feedsUsdLatestRoundResults[callIndex]
      const { data: latestTimestamp } = feedsUsdLatestTimestampResults[callIndex]
      const assetId = feedsUsdTimestampResults[callIndex].extraData.assetId?.toString() || feedsUsdTimestampResults[callIndex].callData.target.toLowerCase()
      // const pastRoundData = pastRoundsResults?.find( (callResult: DecodedResult) => callResult.extraData.assetId === assetId )
      // const pastRound = pastRoundData?.data
      return {
        ...feedsUsdRoundBounds,
        [assetId]: {
          // pastRound,
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

      if (!feedUsdAddress || !feedUsdRoundBounds || !multiCall) return calls

      const rawCalls = chainlinkHelper.getHistoricalPricesRawCalls(assetId, feedUsdAddress, feedUsdRoundBounds, maxDays)
      return [
        ...calls,
        // @ts-ignore
        ...multiCall.getCallsFromRawCalls(rawCalls)
      ]
    }, [])

    // const startTimestamp = Date.now();
    // @ts-ignore
    const results = await multiCall.executeMulticalls(historicalPricesCalls, true, 1, web3Chains[1])
    
    // console.log('historicalPricesCalls', results)

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

    // console.log('assetsPricesUsd', assetsPricesUsd)
      
    const historicalPricesUsd: Record<AssetId, HistoryData[]> = Object.keys(assetsPricesUsd).reduce( (historicalPricesUsd: Record<AssetId, HistoryData[]>, assetId: AssetId) => {
      return {
        ...historicalPricesUsd,
        [assetId]: Object.values(assetsPricesUsd[assetId])
      }
    }, {})

    // console.log('historicalPricesUsd', historicalPricesUsd)

    return historicalPricesUsd
  }, [web3, web3Chains, multiCall, selectAssetById])

  // Get tokens prices, balances, rates
  useEffect(() => {
    if (!state.vaults.length || !state.contracts.length || !multiCall || runningEffects.current.portfolioLoading === (account?.address || true)) return

    // console.log('Load portfolio', isEmpty(state.aprs), account?.address, runningEffects.current.portfolioLoading);

    // Avoid refreshing if disconnected and already loaded data
    if (!isEmpty(state.aprs) && !account?.address) {
      return dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
    }

    // dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})

    ;(async () => {

      runningEffects.current.portfolioLoading = account?.address || true

      const startTimestamp = Date.now()

      // Update balances only if account changed
      const enabledCalls = isEmpty(state.aprs) ? [] : ['balances', 'rewards']

      const vaultsOnChainData = await getVaultsOnchainData(state.vaults, enabledCalls)
      
      // console.log('Loading Portfolio', account?.address, accountChanged, state.isPortfolioLoaded, state.aprs, enabledCalls, vaultsOnChainData)

      // console.log('Vaults Data', enabledCalls, vaultsOnChainData)

      if (!vaultsOnChainData) {
        runningEffects.current.portfolioLoading = false
        return
      }

      const {
        fees,
        aprs,
        limits,
        rewards,
        balances,
        baseAprs,
        pricesUsd,
        aprRatios,
        maticNFTs,
        // assetsData,
        gaugesData,
        // stakingData,
        allocations,
        pausedVaults,
        lastHarvests,
        vaultsPrices,
        protocolsAprs,
        aprsBreakdown,
        vaultsRewards,
        totalSupplies,
        additionalAprs,
        idleDistributions,
        interestBearingTokens
      } = vaultsOnChainData

      // const gaugeWeights = await getGaugesWeights(state.vaults)

      // Always update assets data
      // dispatch({type: 'SET_ASSETS_DATA', payload: {...state.assetsData, ...assetsData}})
      const newState: any = {}
      
      // dispatch({type: 'SET_STAKING_DATA', payload: stakingData})
      // dispatch({type: 'SET_LAST_HARVESTS', payload: {...state.lastHarvests, ...lastHarvests}})

      // newState.stakingData = stakingData
      newState.lastHarvests = {...state.lastHarvests, ...lastHarvests}
      newState.pausedVaults = {...state.pausedVaults, ...pausedVaults}
      newState.interestBearingTokens = {...state.interestBearingTokens, ...interestBearingTokens}

      if (!enabledCalls.length || enabledCalls.includes('fees')) {
        const payload = !enabledCalls.length || accountChanged ? fees : {...state.fees, ...fees}
        newState.fees = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('limits')) {
        const payload = !enabledCalls.length || accountChanged ? limits : {...state.limits, ...limits}
        newState.limits = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? aprRatios : {...state.aprRatios, ...aprRatios}
        newState.aprRatios = payload
        // dispatch({type: 'SET_APR_RATIOS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? baseAprs : {...state.baseAprs, ...baseAprs}
        newState.baseAprs = payload
        // dispatch({type: 'SET_BASE_APRS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? idleDistributions : {...state.idleDistributions, ...idleDistributions}
        newState.idleDistributions = payload
        // dispatch({type: 'SET_BASE_APRS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('protocols')) {
        const payload = !enabledCalls.length || accountChanged ? protocolsAprs : {...state.protocolsAprs, ...protocolsAprs}
        newState.protocolsAprs = payload
        // dispatch({type: 'SET_ALLOCATIONS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('protocols')) {
        const payload = !enabledCalls.length || accountChanged ? allocations : {...state.allocations, ...allocations}
        newState.allocations = payload
        // dispatch({type: 'SET_ALLOCATIONS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? aprs : {...state.aprs, ...aprs}
        newState.aprs = payload
        // dispatch({type: 'SET_APRS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? additionalAprs : {...state.additionalAprs, ...additionalAprs}
        newState.additionalAprs = payload
        // dispatch({type: 'SET_ADDITIONAL_APRS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? aprsBreakdown : {...state.aprsBreakdown, ...aprsBreakdown}
        newState.aprsBreakdown = payload
        // dispatch({type: 'SET_APRS_BREAKDOWN', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        const payload = !enabledCalls.length || accountChanged ? rewards : {...state.rewards, ...rewards}
        newState.rewards = payload
        // dispatch({type: 'SET_REWARDS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        // console.log('SET_VAULTS_REWARDS', enabledCalls, state.vaultsRewards, vaultsRewards)
        const payload = !enabledCalls.length || accountChanged ? vaultsRewards : {...state.vaultsRewards, ...vaultsRewards}
        newState.vaultsRewards = payload
        // dispatch({type: 'SET_VAULTS_REWARDS', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        const payload = !enabledCalls.length || accountChanged ? balances : {...state.balances, ...balances}
        newState.balances = payload
        // dispatch({type: 'SET_BALANCES', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        newState.maticNFTs = maticNFTs
        // dispatch({type: 'SET_MATIC_NTFS', payload: maticNFTs })
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        const payload = !enabledCalls.length || accountChanged ? gaugesData : {...state.gaugesData, ...gaugesData}
        newState.gaugesData = payload
        // dispatch({type: 'SET_GAUGES_DATA', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('pricesUsd')) {
        const payload = !enabledCalls.length || accountChanged ? pricesUsd : {...state.pricesUsd, ...pricesUsd}
        newState.pricesUsd = payload
        // dispatch({type: 'SET_PRICES_USD', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('prices')) {
        const payload = !enabledCalls.length || accountChanged ? vaultsPrices : {...state.vaultsPrices, ...vaultsPrices}
        newState.vaultsPrices = payload
        // dispatch({type: 'SET_VAULTS_PRICES', payload })
      }
      if (!enabledCalls.length || enabledCalls.includes('totalSupplies')) {
        const payload = !enabledCalls.length || accountChanged ? totalSupplies : {...state.totalSupplies, ...totalSupplies}
        newState.totalSupplies = payload
        // dispatch({type: 'SET_TOTAL_SUPPLIES', payload })
      }

      // console.log('postfolioLoaded', newState)

      dispatch({type: 'SET_STATE', payload: newState})

      // Don't update if partial loading
      if (!state.isPortfolioLoaded || accountChanged) {
        dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})
      }

      // runningEffects.current.portfolioLoading = false

      // eslint-disable-next-line
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
  }, [account, state.vaults, state.contracts])

  // Get historical underlying prices from chainlink
  useEffect(() => {

    if (isEmpty(state.vaults) || !isEmpty(state.historicalPricesUsd) || !web3 || !multiCall || !storedHistoricalPricesUsdLoaded || runningEffects.current.historicalPricesUsd === true) return

    // console.log('Check historicalPricesUsd', storedHistoricalPricesUsdLoaded, storedHistoricalPricesUsd)
    runningEffects.current.historicalPricesUsd = true

    // Load 1 year by default
    let maxDays = 365

    // Prices are already stored
    if (!isEmpty(storedHistoricalPricesUsd) && storedHistoricalPricesUsd.timestamp){
      const latestStoredTimestamp = Object.keys(storedHistoricalPricesUsd.historicalPricesUsd).reduce( (latestStoredTimestamp: number, assetId) => {
        const latestAssetData: HistoryData = (Object.values(storedHistoricalPricesUsd.historicalPricesUsd[assetId]).pop() as HistoryData)
        if (latestAssetData){
          if (!latestStoredTimestamp || latestAssetData.date<latestStoredTimestamp){
            latestStoredTimestamp = latestAssetData.date
          }
        }
        return latestStoredTimestamp
      }, Date.now())
      const daysDiff = dayDiff(Date.now(), latestStoredTimestamp)
      // console.log('storedHistoricalPricesUsd', Date.now(), latestStoredTimestamp, daysDiff)
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

      // const startTimestamp = Date.now()

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

      runningEffects.current.historicalPricesUsd = false

      // Pre-cached data
      // console.log('historicalPricesCalls - DECODED', (Date.now()-startTimestamp)/1000, mergedHistoricalPricesUsd)

      dispatch({type: 'SET_HISTORICAL_PRICES_USD', payload: mergedHistoricalPricesUsd})
    })()
  // eslint-disable-next-line
  }, [state.vaults, web3, multiCall, storedHistoricalPricesUsdLoaded, getChainlinkHistoricalPrices])
  
  // Get historical vaults data
  useEffect(() => {

    // console.log('Load historical data', state.vaults, state.isPortfolioLoaded, vaultFunctionsHelper, state.historicalRates)

    if (isEmpty(state.vaults) || !state.isPortfolioLoaded || !vaultFunctionsHelper || !isEmpty(state.historicalRates)) return

    // Get Historical data
    ;(async () => {
      const startTimestamp = Date.now();

      // Fetch historical data from the first deposit (min 1 year)
      const vaultsHistoricalDataPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
        const asset = selectAssetById(vault.id)
        if (asset) {
          // const firstDepositTimestamp = asset.vaultPosition?.firstDepositTx?.timeStamp
          const startTime = ("stats" in vault) && vault.stats?.startTimestamp ? Math.round(+vault.stats?.startTimestamp/1000) : dayjs().subtract(1, 'year').unix()
          const start = Math.round(dayjs(+startTime*1000).startOf('day').valueOf()/1000)
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

      const [
        vaultsHistoricalData,
        // vaultsCollectedFees
      ] = await Promise.all([
        Promise.all(vaultsHistoricalDataPromises),
        // vaultFunctionsHelper.getVaultsCollectedFees(state.vaults)
      ])

      // console.log('vaultsHistoricalData', vaultsHistoricalData)

      const tvls: Record<AssetId, HistoryData[]> = {}
      const rates: Record<AssetId, HistoryData[]> = {}
      const prices: Record<AssetId, HistoryData[]> = {}
      // const tvlsUsd: Record<AssetId, HistoryData[]> = {}

      vaultsHistoricalData.forEach( (vaultHistoricalData: VaultHistoricalData) => {
        const assetId = vaultHistoricalData.vaultId
        const asset = selectAssetById(assetId)
        if (asset){
          tvls[assetId] = vaultHistoricalData.tvls
          rates[assetId] = vaultHistoricalData.rates
          prices[assetId] = vaultHistoricalData.prices

          const ratesSum = rates[assetId].reduce( (total: BigNumber, rate: HistoryData) => total.plus(rate.value), BNify(0) )
          if (bnOrZero(ratesSum).lte(0)){
            rates[assetId] = []
            // const firstPoint = prices[assetId][0] as HistoryData
            prices[assetId].forEach( (data: HistoryData, index: number) => {
              if (index>7){
                const prevPoint = prices[assetId][index-7]
                const gainPercentage = BNify(data.value).div(bnOrZero(prevPoint.value)).minus(1)
                const secondsDiff = Math.round((data.date-prevPoint.date)/1000)
                const apy = gainPercentage.times(SECONDS_IN_YEAR).div(secondsDiff).times(100)
                rates[assetId].push({
                  date: data.date,
                  value: apy.toNumber()
                })
                // console.log(data.date, gainPercentage.toString(), secondsDiff, apy.toString())
              }
            })
          }

          dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { tvls: tvls[assetId], rates: rates[assetId], prices: prices[assetId] } }})
        }
      })

      // console.log('prices', prices)

      dispatch({type: 'SET_HISTORICAL_TVLS', payload: tvls})
      dispatch({type: 'SET_HISTORICAL_RATES', payload: rates})
      dispatch({type: 'SET_HISTORICAL_PRICES', payload: prices})
      // dispatch({type: 'SET_VAULTS_COLLECTED_FEES', payload: vaultsCollectedFees})

      // eslint-disable-next-line
      console.log('HISTORICAL DATA LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()

  // eslint-disable-next-line
  }, [state.vaults, state.isPortfolioLoaded])

  // Get staking data
  useEffect(() => {
    if (!multiCall || !web3Chains || isEmpty(state.vaults) || !state.isPortfolioAccountReady || !vaultFunctionsHelper || runningEffects.current.stakingData === (account?.address || true)) return

    ;(async () => {

      runningEffects.current.stakingData = account?.address || true

      const startTimestamp = Date.now()
      const stkIdleCalls = getStkIdleCalls()
      const stakedIdleVault = state.vaults.find( (vault: Vault) => vault.type === 'STK' ) as StakedIdleVault

      const [
        stkIdleResults,
        stakedIdleVaultRewards
      ] = await Promise.all([
        multiCall.executeMulticalls(stkIdleCalls, true, STAKING_CHAINID, web3Chains[STAKING_CHAINID]),
        vaultFunctionsHelper.getStakingRewards(stakedIdleVault, STAKING_CHAINID)
      ])

      if (!stkIdleResults){
        runningEffects.current.stakingData = false
        return
      }

      const [
        stkIdleTotalLocked,
        stkIdleTotalSupply,
        stkIdleLock,
        stkIdleBalance,
        stkIdleClaimable
      ] = stkIdleResults.map( r => r.data )

      const firstRewardTimestamp: number = stakedIdleVaultRewards?.length ? +(stakedIdleVaultRewards[0] as EtherscanTransaction).timeStamp : 0
      const lastRewardTimestamp: number = stakedIdleVaultRewards?.length ? +(stakedIdleVaultRewards[stakedIdleVaultRewards.length-1] as EtherscanTransaction).timeStamp : 0
      const stkIdletotalRewardsDays = stakedIdleVaultRewards?.length ? Math.abs(lastRewardTimestamp-firstRewardTimestamp)/86400 : 0
      const stkIdleTotalRewards: BigNumber = stakedIdleVaultRewards.reduce( ( total: BigNumber, tx: EtherscanTransaction) => total.plus(fixTokenDecimals(tx.value, 18)), BNify(0) )
      const maxApr = stkIdleTotalRewards.div(fixTokenDecimals(stkIdleTotalSupply, 18)).times(365.2425).div(stkIdletotalRewardsDays).times(100)
      const avgLockTime = parseFloat(fixTokenDecimals(stkIdleTotalSupply, 18).div(fixTokenDecimals(stkIdleTotalLocked, 18)).times(MAX_STAKING_DAYS).toFixed())

      // console.log(`stkIdleTotalRewards: ${stkIdleTotalRewards.toFixed()}, stkIdleTotalLocked: ${fixTokenDecimals(stkIdleTotalLocked, 18).toFixed()}, stkIdletotalRewardsDays: ${stkIdletotalRewardsDays.toFixed()}`)

      const stakingData: StakingData = {
        maxApr,
        avgLockTime,
        rewards: stakedIdleVaultRewards,
        rewardsDays: stkIdletotalRewardsDays,
        position: {
          lockEnd: +stkIdleLock.end*1000,
          claimable: fixTokenDecimals(stkIdleClaimable, 18),
          deposited: fixTokenDecimals(stkIdleLock.amount, 18),
          balance: fixTokenDecimals(stkIdleBalance, 18),
          share: fixTokenDecimals(stkIdleBalance, 18).div(fixTokenDecimals(stkIdleTotalSupply, 18)).times(100)
        },
        IDLE: {
          asset: protocolToken,
          totalRewards: stkIdleTotalRewards,
          totalSupply: fixTokenDecimals(stkIdleTotalLocked, 18)
        },
        stkIDLE: {
          asset: stkIDLEToken,
          totalSupply: fixTokenDecimals(stkIdleTotalSupply, 18),
        }
      }

      dispatch({type: 'SET_STAKING_DATA', payload: stakingData})

      // eslint-disable-next-line
      console.log('STAKING DATA LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()
  // eslint-disable-next-line
  }, [multiCall, web3Chains, vaultFunctionsHelper, state.vaults, account, state.isPortfolioAccountReady])

  // Get historical collected fees
  useEffect(() => {
    if (isEmpty(state.vaults) || +chainId !== 1 || +chainId !== +state.vaultsChain || !state.isPortfolioLoaded || !vaultFunctionsHelper || !isEmpty(state.vaultsCollectedFees) || runningEffects.current?.vaultsCollectedFeesProcessing || +(runningEffects.current?.vaultsCollectedFees || 0)>5) return

    // Get Historical data
    ;(async () => {

      if (!runningEffects.current.vaultsCollectedFees){
        runningEffects.current.vaultsCollectedFees = 0
      }
      runningEffects.current.vaultsCollectedFeesProcessing = true
      runningEffects.current.vaultsCollectedFees = +runningEffects.current.vaultsCollectedFees+1

      const startTimestamp = Date.now();
      const vaultsCollectedFees = await vaultFunctionsHelper.getVaultsCollectedFees(state.vaults)
      dispatch({type: 'SET_VAULTS_COLLECTED_FEES', payload: vaultsCollectedFees})

      runningEffects.current.vaultsCollectedFeesProcessing = false

      // console.log('vaultsCollectedFees', state.vaultsChain, runningEffects.current.vaultsCollectedFees, chainId, isNetworkCorrect, state.vaults, vaultsCollectedFees)

      // eslint-disable-next-line
      console.log('COLLECTED FEES LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()
  // eslint-disable-next-line
  }, [state.vaults, state.vaultsChain, state.isPortfolioLoaded, vaultFunctionsHelper])

  // Calculate historical USD Tvls
  useEffect(() => {
    if (isEmpty(state.historicalPricesUsd) || isEmpty(state.historicalTvls)) return
    const historicalTvlsUsd = Object.keys(state.historicalTvls).reduce( (historicalTvlsUsd: InitialState["historicalTvlsUsd"], assetId: AssetId) => {
      if (!state.historicalTvls[assetId]/* || !state.historicalPricesUsd[assetId]*/) return historicalTvlsUsd
      historicalTvlsUsd[assetId] = state.historicalTvls[assetId].map( (data: HistoryData) => {
        const asset = selectAssetById(assetId)
        const priceUsd = selectAssetHistoricalPriceUsdByTimestamp(asset?.underlyingId, data.date)?.value || BNify(1)
        const value = BNify(data.value).times(priceUsd)
        // console.log('priceUsd', assetId, data.date, priceUsd, value.toString())
        return {
          value,
          date: data.date
        }
      })
      return historicalTvlsUsd
    }, {})

    dispatch({type: 'SET_HISTORICAL_TVLS_USD', payload: historicalTvlsUsd})

    // const totalTvl = calculateTotalHistoricalTvl(historicalTvlsUsd)

  // eslint-disable-next-line
  }, [state.historicalPricesUsd, state.historicalTvls])

  // Get user vaults positions
  useEffect(() => {
    // console.log('Load Vaults Positions', account?.address, state.balances, state.isPortfolioLoaded, walletInitialized, connecting, runningEffects.current.vaultsPositions)
    if (!account?.address || !state.isPortfolioLoaded || isEmpty(state.balances) || !walletInitialized || connecting || runningEffects.current.vaultsPositions) return

    ;(async () => {
      runningEffects.current.vaultsPositions = true

      const results = await getVaultsPositions(state.vaults)
      // console.log('getVaultsPositions', state.balances, results)

      const {
        vaultsPositions,
        distributedRewards,
        vaultsTransactions
      } = results

      dispatch({type: 'SET_VAULTS_POSITIONS_LOADED', payload: true})
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions})
      dispatch({type: 'SET_DISTRIBUTED_REWARDS', payload: distributedRewards})
      dispatch({type: 'SET_VAULTS_TRANSACTIONS', payload: vaultsTransactions})

      runningEffects.current.vaultsPositions = false
    })()

    // Clean transactions and positions
    return () => {
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: {}})
      dispatch({type: 'SET_DISTRIBUTED_REWARDS', payload: {}})
      dispatch({type: 'SET_VAULTS_TRANSACTIONS', payload: []})
      dispatch({type: 'SET_VAULTS_POSITIONS_LOADED', payload: false})
    }
  // eslint-disable-next-line
  }, [account, state.isPortfolioLoaded, state.balances, state.portfolioTimestamp, walletInitialized, connecting])

  // Calculate distributed rewards APYs
  useEffect(() => {
    if (!web3Chains || !state.contractsNetworks || !state.isVaultsPositionsLoaded || isEmpty(state.distributedRewards) || runningEffects.current.distributedRewards === (account?.address || true)) return;
    ;(async() => {

      runningEffects.current.distributedRewards = account?.address || true

      const distributedRewards = await asyncReduce<AssetId, VaultsPositions["distributedRewards"]>(
        Object.keys(state.distributedRewards),
        async (assetId) => {
          const res = state.distributedRewards
          const asset = selectAssetById(assetId)
          const vaultPosition = selectVaultPosition(assetId);
          if (!asset || !vaultPosition || !asset.chainId) return res
          const assetChainId = +asset.chainId
          await asyncForEach(Object.keys(state.distributedRewards[assetId]), async (rewardId: AssetId) => {
            const underlyingToken = selectUnderlyingTokenByAddress(assetChainId, rewardId)
            if (!underlyingToken) return
            const latestDistribution = sortArrayByKey(state.distributedRewards[assetId][rewardId], 'timeStamp', 'desc')[0]
            // Check if tx is not older than a week
            if (dayDiff(latestDistribution.timeStamp, Date.now())<=7){
              const genericContractsHelper = new GenericContractsHelper({chainId: assetChainId, web3: web3Chains[assetChainId], contracts: state.contractsNetworks[assetChainId]})
              const conversionRate = await genericContractsHelper.getConversionRate(underlyingToken, +latestDistribution.blockNumber)
              const distributedReward = latestDistribution.value
              const distributedRewardUsd = distributedReward.times(conversionRate)
              const apr = distributedRewardUsd.div(vaultPosition.usd.redeemable).times(52.1429)
              res[assetId][rewardId][res[assetId][rewardId].length-1].apr = apr
            }
          })
          return res
        },
        (distributedRewards, assetRewards) => {
          return {
            ...distributedRewards,
            ...assetRewards
          }
          // return Object.keys(assetRewards).reduce( (distributedRewards, assetId: AssetId) => {
          //   Object(assetRewards[assetId]).forEach( (rewardId: AssetId) => {
          //     const lastIndex = assetRewards[assetId][rewardId].index
          //     distributedRewards[assetId][rewardId][lastIndex].apr = assetRewards[assetId][rewardId].apr
          //   })
          //   return distributedRewards
          // }, distributedRewards)
        },
        {...state.distributedRewards}
      )

      // runningEffects.current.distributedRewards = false
      // console.log('distributedRewards', distributedRewards)

      dispatch({type: 'SET_DISTRIBUTED_REWARDS', payload: distributedRewards})

    })()

    // Clean transactions and positions
    return () => {
      // runningEffects.current.distributedRewards = false
      // dispatch({type: 'SET_DISTRIBUTED_REWARDS', payload: {}})
    }
  }, [state.distributedRewards, selectVaultPosition, state.isVaultsPositionsLoaded, selectAssetById, state.contractsNetworks, web3Chains, account?.address])

  // Set isPortfolioAccountReady
  useEffect(() => {
    if (!walletInitialized || connecting || !state.isPortfolioLoaded) return
    const isPortfolioAccountReady = state.isPortfolioLoaded && (!account?.address || state.isVaultsPositionsLoaded)
    // console.log('isPortfolioAccountReady', walletInitialized, connecting, account, state.isPortfolioLoaded, state.isVaultsPositionsLoaded, isPortfolioAccountReady)
    dispatch({type: 'SET_PORTFOLIO_ACCOUNT_READY', payload: isPortfolioAccountReady})

    return () => {
      dispatch({type: 'SET_PORTFOLIO_ACCOUNT_READY', payload: false})
    }
  }, [account, state.isPortfolioLoaded, state.isVaultsPositionsLoaded, walletInitialized, connecting])
  
  // Update balances USD
  useEffect(() => {
    if (!account?.address || isEmpty(state.balances)/* || isEmpty(state.vaultsPositions)*/) return

    const startTimestamp = Date.now();

    const balances: Record<string, BigNumber> = {
      total: BNify(0),
    }

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

        balances.total = balances.total.plus(balancesUsd[assetId])

        // Init balance type
        if (!balances[asset.type as string]){
          balances[asset.type as string] = BNify(0)
        }
        balances[asset.type as string] = balances[asset.type as string].plus(balancesUsd[assetId])

        // if (!asset.balanceUsd || !asset.balanceUsd.eq(balancesUsd[assetId])){
        //   dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {balanceUsd: balancesUsd[assetId]} }})
        // }
      }
      return balancesUsd
    }, {})

    sendCustomEvent('user_balances', {
      address: account?.address.replace('0x', ''),
      ...Object.keys(balances).reduce( (balancesParsed: Record<string, string>, type: string) => {
        return {
          ...balancesParsed,
          [type]: bnOrZero(balances[type]).toFixed(2)
        }
      }, {})
    })

    dispatch({type: 'SET_BALANCES_USD', payload: balancesUsd})

    // eslint-disable-next-line
    console.log('BALANCES LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')

    // Cleanup
    return () => {
      dispatch({type: 'SET_BALANCES_USD', payload: {}})
    };

  // eslint-disable-next-line
  }, [account, state.balances, state.vaultsPositions, selectVaultPosition, selectAssetPriceUsd, selectAssetBalance, selectVaultPrice])

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

      if (!gaugeData) return gaugesRewards

      for (const rewardId in gaugeData.rewards) {
        const gaugeRewardData = gaugeData.rewards[rewardId]
        const gaugeShare = gaugeVaultPosition && gauge.totalSupply ? BNify(gaugeVaultPosition.underlying.redeemable).div(gauge.totalSupply) : BNify(0)

        if (BNify(gaugeRewardData.balance).gt(0)){
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

          if (gaugeVaultPosition){
            gaugesRewards[rewardId].deposited = BNify(gaugesRewards[rewardId].deposited).plus(gaugeVaultPosition.usd.deposited)
            if (gaugeRewardData.apr) {
              gaugesRewards[rewardId].apr = BNify(gaugesRewards[rewardId].apr).plus(BNify(gaugeRewardData.apr).times(gaugeVaultPosition.usd.deposited))
            }
          }

          if (gaugeRewardData.rate){
            gaugesRewards[rewardId].rate = BNify(gaugesRewards[rewardId].rate).plus(BNify(gaugeRewardData.rate).times(gaugeShare))
          }
          if (gaugeRewardData.balance){
            gaugesRewards[rewardId].balance = BNify(gaugesRewards[rewardId].balance).plus(gaugeRewardData.balance)
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

  }, [state.vaultsPositions, state.isVaultsPositionsLoaded, state.isPortfolioLoaded, selectVaultsAssetsByType, selectVaultById])

  // Generate Assets Data
  useEffect(() => {
    if (isEmpty(state.vaults) || isEmpty(state.vaultsNetworks)) return

    // Generate assets data 
    const assetsData: Assets = Object.keys(state.vaultsNetworks).reduce( ( assetsData: Assets, chainId: any) => {
      return {
        ...assetsData,
        ...generateAssetsData(state.vaultsNetworks[chainId])
      }
    }, {})

    // console.log('assetsData', assetsData)

    for (const vault of state.vaults){
      if (state.pausedVaults[vault.id] && assetsData[vault.id].status !== 'deprecated'){
        assetsData[vault.id].status = 'paused'
      }

      assetsData[vault.id].tvl = BNify(0)
      assetsData[vault.id].tvlUsd = BNify(0)
      assetsData[vault.id].totalTvl = BNify(0)
      assetsData[vault.id].flags = vault.flags
      assetsData[vault.id].fee = state.fees[vault.id]
      assetsData[vault.id].limit = state.limits[vault.id] || BNify(0)
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
      assetsData[vault.id].protocolsAprs =  state.protocolsAprs[vault.id]
      assetsData[vault.id].vaultPosition =  state.vaultsPositions[vault.id]
      assetsData[vault.id].collectedFees = state.vaultsCollectedFees[vault.id] || []
      assetsData[vault.id].additionalApr =  state.additionalAprs[vault.id] || BNify(0)
      assetsData[vault.id].distributedRewards = state.distributedRewards[vault.id] || {}
      assetsData[vault.id].idleDistribution =  state.idleDistributions[vault.id] || BNify(0)
      assetsData[vault.id].interestBearingTokens =  state.interestBearingTokens[vault.id] || {}

      // Add protocol
      if ("protocol" in vault){
        assetsData[vault.id].protocol = vault.protocol
      }

      // Add variant
      if ("variant" in vault){
        assetsData[vault.id].variant = vault.variant
      }

      // Update Underlying price Usd
      if (("underlyingToken" in vault) && vault.underlyingToken?.address){
        assetsData[vault.underlyingToken.address.toLowerCase()].priceUsd = assetsData[vault.id].priceUsd
      }

      // Update staking vault priceUsd
      if (vault.type === 'STK' && ("rewardTokenConfig" in vault)){
        const underlyingToken = assetsData[vault.rewardTokenConfig.address.toLowerCase()]
        if (underlyingToken){
          assetsData[vault.id].priceUsd = underlyingToken.priceUsd
        }
      }

      assetsData[vault.id].aprBreakdown =  state.aprsBreakdown[vault.id] || {}

      // Add gauge to vault apr breakdown
      if (vault.type==='GG' && ("trancheVault" in vault) && vault.enabled){
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
        // Calculate APYs
        assetsData[vault.id].apyBreakdown = Object.keys(assetsData[vault.id].aprBreakdown || {}).reduce( (apyBreakdown: Balances, type: string): Balances => {
          const apr = assetsData[vault.id].aprBreakdown?.[type]
          if (apr){
            if (type !== 'rewards'){
              apyBreakdown[type] = apr2apy(BNify(apr).div(100)).times(100)
            } else {
              apyBreakdown[type] = apr
            }
            // console.log(vault.id, type, apr.toString(), apyBreakdown[type].toString())
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
        const prices7 = assetsData[vault.id].prices!.slice(assetsData[vault.id].prices!.length-7)
        const prices7_last_rate = prices7 ? BNify([...prices7].pop()?.value) : BNify(0)
        const price_apy7 = prices7_last_rate.div(BNify(prices7[0].value)).minus(1).times(365).div(7).times(100)

        // console.log('prices7', vault.id, prices7, BNify(prices7[0].value).toString(), rates7_last_rate.toString(), assetsData[vault.id].apy7.toString())

        // Calculate APY 7 days
        const rates7 = assetsData[vault.id].rates!.slice(assetsData[vault.id].rates!.length-7).map( (data: HistoryData) => data.value )
        const avg_rate7 = BNify(avgArray(rates7))

        assetsData[vault.id].apy7 = avg_rate7.gt(0) ? avg_rate7 : price_apy7

        // Calculate APY 30 days
        const prices30 = assetsData[vault.id].prices!.slice(assetsData[vault.id].prices!.length-30)
        const prices30_last_rate = prices30 ? BNify([...prices30].pop()?.value) : BNify(0)
        const price_apy30 = prices30_last_rate.div(BNify(prices30[0].value)).minus(1).times(365).div(30).times(100)

        // Calculate APY 30 days
        const rates30 = assetsData[vault.id].rates!.slice(assetsData[vault.id].rates!.length-30).map( (data: HistoryData) => data.value )
        const avg_rate30 = BNify(avgArray(rates30))

        assetsData[vault.id].apy30 = avg_rate30.gt(0) ? avg_rate30 : price_apy30

        // Calculate rates
        /*
        const ratesSum = assetsData[vault.id].rates?.reduce( (total: BigNumber, rate: HistoryData) => total.plus(rate.value), BNify(0) )
        if (bnOrZero(ratesSum).lte(0)){
          assetsData[vault.id].rates = []
          const firstPoint = assetsData[vault.id].prices?.[0] as HistoryData
          assetsData[vault.id].prices?.forEach( (data: HistoryData, index: number) => {
            if (index){
              const gainPercentage = BNify(data.value).div(bnOrZero(firstPoint.value)).minus(1)
              const secondsDiff = Math.round((data.date-firstPoint.date)/1000)
              const apy = gainPercentage.times(SECONDS_IN_YEAR).div(secondsDiff).times(100)
              assetsData[vault.id].rates?.push({
                date: data.date,
                value: apy.toNumber()
              })
              // console.log(data.date, gainPercentage.toString(), secondsDiff, apy.toString())
            }
          })

          console.log(vault.id, assetsData[vault.id].rates)
        }
        */

        // console.log('rates30', vault.id, rates30, BNify(rates30[0].value).toString(), rates30_last_rate.toString(), assetsData[vault.id].apy30.toString())
      } else {
        assetsData[vault.id].apy7 = assetsData[vault.id].apy
        assetsData[vault.id].apy30 = assetsData[vault.id].apy
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

    // console.log('assetsData', assetsData)
    
    dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
  }, [
    state.fees,
    state.aprs,
    state.vaults,
    state.limits,
    state.rewards,
    state.baseAprs,
    state.balances,
    state.aprRatios,
    state.pricesUsd,
    state.gaugesData,
    state.balancesUsd,
    state.allocations,
    state.vaultsPrices,
    state.lastHarvests,
    state.pausedVaults,
    state.totalSupplies,
    state.vaultsRewards,
    state.aprsBreakdown,
    state.protocolsAprs,
    state.additionalAprs,
    state.vaultsNetworks,
    state.historicalRates,
    state.vaultsPositions,
    state.historicalPrices,
    state.idleDistributions,
    state.distributedRewards,
    state.historicalPricesUsd,
    state.vaultsCollectedFees,
    state.interestBearingTokens
  ])

  return (
    <PortfolioProviderContext.Provider value={state}>
      {children}
    </PortfolioProviderContext.Provider>
  )
}
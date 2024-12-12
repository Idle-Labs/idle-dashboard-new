import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { GaugeVault } from 'vaults/GaugeVault'
import useLocalForge from 'hooks/useLocalForge'
import { useWeb3Provider } from './Web3Provider'
import { TrancheVault } from 'vaults/TrancheVault'
import { AssetTransfersResult } from "alchemy-sdk"
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { StakedIdleVault } from 'vaults/StakedIdleVault'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { useCacheProvider } from 'contexts/CacheProvider'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { GenericContract } from 'contracts/GenericContract'
import { historicalPricesUsd } from 'constants/historicalData'
import type { CallData, DecodedResult } from 'classes/Multicall'
import type { CdoLastHarvest } from 'classes/VaultFunctionsHelper'
import type { EventLog, TransactionReceipt, Log } from 'web3-core'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { selectUnderlyingToken, selectUnderlyingTokenByAddress } from 'selectors/'
import { SECONDS_IN_YEAR, STAKING_CHAINID, GOVERNANCE_CHAINID, WEEKS_PER_YEAR } from 'constants/vars'
import { createContext, useContext, useEffect, useMemo, useCallback, useReducer, useRef } from 'react'
import { VaultFunctionsHelper, ChainlinkHelper, FeedRoundBounds, GenericContractsHelper } from 'classes/'
import { GaugeRewardData, strategies, GenericContractConfig, UnderlyingTokenProps, ContractRawCall, DistributedReward, explorers, networks, ZERO_ADDRESS, CreditVaultConfig, credits } from 'constants/'
import { globalContracts, bestYield, tranches, gauges, underlyingTokens, EtherscanTransaction, stkIDLE_TOKEN, PROTOCOL_TOKEN, MAX_STAKING_DAYS, IdleTokenProtocol } from 'constants/'
import type { ReducerActionTypes, VaultsRewards, Balances, RewardSenders, StakingData, Asset, AssetId, Assets, Vault, Transaction, BalancePeriod, VaultPosition, VaultAdditionalApr, VaultHistoricalData, HistoryData, GaugeRewards, GaugesRewards, GaugesData, MaticNFT, EpochData, RewardEmission, CdoEvents, EthenaCooldown, ProtocolData, Address, VaultsAccountData, VaultContractCdoEpochData, VaultBlockRequest } from 'constants/types'
import { BNify, bnOrZero, makeEtherscanApiRequest, apr2apy, isEmpty, dayDiff, fixTokenDecimals, asyncReduce, avgArray, asyncWait, checkAddress, cmpAddrs, sendCustomEvent, asyncForEach, getFeeDiscount, floorTimestamp, sortArrayByKey, toDayjs, getAlchemyTransactionHistory, arrayUnique, getEtherscanTransactionObject, checkVaultEnv, checkVaultAuthCode, normalizeTokenAmount, compoundVaultApr } from 'helpers/'
import { CreditVault } from 'vaults/CreditVault'
import { useAuthCodeProvider } from './AuthCodeProvider'
import { getLatestVaultBlocks, getVaultsFromApiV2 } from 'helpers/apiv2'

type VaultsPositions = {
  vaultsPositions: Record<AssetId, VaultPosition>
  vaultsTransactions: Record<AssetId, Transaction[]>
  discountedFees: Record<AssetId, Asset["discountedFees"]>
  distributedRewards: Record<AssetId, Asset["distributedRewards"]>
}

type VaultsOnchainData = {
  fees: Balances
  aprs: Balances
  limits: Balances
  baseAprs: Balances
  balances: Balances
  aprRatios: Balances
  totalAprs: Balances
  pricesUsd: Balances
  maticNFTs: MaticNFT[]
  gaugesData: GaugesData
  vaultsPrices: Balances
  currentRatios: Balances
  totalSupplies: Balances
  additionalAprs: Balances
  idleDistributions: Balances
  vaultsRewards: VaultsRewards
  // stakingData: StakingData | null
  ethenaCooldowns: EthenaCooldown[]
  rewards: Record<AssetId, Balances>
  poolsData: Record<AssetId, Balances>
  openVaults: Record<AssetId, boolean>
  allocations: Record<AssetId, Balances>
  pausedVaults: Record<AssetId, boolean>
  walletAllowed: Record<AssetId, boolean>
  protocolsAprs: Record<AssetId, Balances>
  aprsBreakdown: Record<AssetId, Balances>
  epochsData: Record<AssetId, Asset["epochData"]>
  interestBearingTokens: Record<AssetId, Balances>
  lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>
  morphoRewardsEmissions: Record<AssetId, Record<AssetId, RewardEmission>>
  gearboxPointsEmissions: Record<AssetId, Record<AssetId, RewardEmission>>
}

type InitialState = {
  vaults: Vault[]
  assetsData: Assets
  balancesUsd: Balances
  isVaultsLoaded: boolean
  helpers: Record<any, any>
  vaultsChain: number | null
  protocolData: ProtocolData
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
  vaultsAccountData: VaultsAccountData | null
  historicalTvls: Record<AssetId, HistoryData[]>
  vaultsPositions: Record<AssetId, VaultPosition>
  historicalRates: Record<AssetId, HistoryData[]>
  historicalPrices: Record<AssetId, HistoryData[]>
  discountedFees: VaultsPositions["discountedFees"]
  historicalTvlsUsd: Record<AssetId, HistoryData[]>
  historicalPricesUsd: Record<AssetId, HistoryData[]>
  vaultsCollectedFees: Record<AssetId, Transaction[]>
  contractsNetworks: Record<string, GenericContract[]>
  vaultsRequests: Record<AssetId, VaultBlockRequest[]>
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
  poolsData: {},
  aprRatios: {},
  selectors: {},
  contracts: [],
  maticNFTs: [],
  pricesUsd: {},
  totalAprs: {},
  openVaults: {},
  gaugesData: {},
  epochsData: {},
  assetsData: {},
  allocations: {},
  balancesUsd: {},
  lastHarvests: {},
  vaultsPrices: {},
  transactions: {},
  pausedVaults: {},
  walletAllowed: {},
  currentRatios: {},
  protocolData: {
    uniqueVaults: 0,
    uniqueChains: 0,
    totalTvlUsd: BNify(0),
    totalAvgApy: BNify(0),
  },
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
  discountedFees: {},
  vaultsRequests: {},
  protocolToken: null,
  ethenaCooldowns: [],
  vaultsPositions: {},
  historicalRates: {},
  historicalPrices: {},
  isVaultsLoaded: false,
  vaultsAccountData: {},
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
  morphoRewardsEmissions: {},
  gearboxPointsEmissions: {},
  isPortfolioAccountReady: false,
  isVaultsPositionsLoaded: false
}

const initialContextState = initialState

const reducer = (state: InitialState, action: ReducerActionTypes) => {

  const currTime = Date.now()
  // console.log(action.type, action.payload)

  switch (action.type) {
    case 'RESET_STATE':
      return {
        ...state,
        rewards: {},
        balances: {},
        maticNFTs: {},
        gaugesData: {},
        balancesUsd: {},
        transactions: {},
        vaultsRewards: {},
        gaugesRewards: {},
        stakingData: null,
        discountedFees: {},
        ethenaCooldowns: {},
        vaultsPositions: {},
        distributedRewards: {},
        isPortfolioLoaded: false,
        portfolioTimestamp: null,
        isPortfolioAccountReady: false,
        isVaultsPositionsLoaded: false,
      }
    /*
    return {
      ...initialState,
      ...action.payload,
      baseAprs: state.baseAprs,
      pricesUsd: state.pricesUsd,
      aprRatios: state.aprRatios,
      allocations: state.allocations,
      lastHarvests: state.lastHarvests,
      vaultsPrices: state.vaultsPrices,
      protocolsAprs: state.protocolsAprs,
      historicalTvls: state.historicalTvls,
      historicalRates: state.historicalRates,
      historicalPrices: state.historicalPrices,
      historicalTvlsUsd: state.historicalTvlsUsd,
      vaultsCollectedFees: state.vaultsCollectedFees,
      historicalPricesUsd: state.historicalPricesUsd,
      interestBearingTokens: state.interestBearingTokens,
      selectors: state.selectors
    }
    */
    case 'SET_STATE':
      return { ...state, ...action.payload }
    case 'SET_PROTOCOL_DATA':
      return { ...state, protocolData: action.payload }
    case 'SET_PROTOCOL_TOKEN':
      return { ...state, protocolToken: action.payload }
    case 'SET_PORTFOLIO_TIMESTAMP':
      return { ...state, portfolioTimestamp: action.payload }
    case 'SET_VAULTS_LOADED':
      return { ...state, isVaultsLoaded: action.payload }
    case 'SET_PORTFOLIO_LOADED':
      return { ...state, isPortfolioLoaded: action.payload, portfolioTimestamp: currTime }
    case 'SET_PORTFOLIO_ACCOUNT_READY':
      return { ...state, isPortfolioAccountReady: action.payload }
    case 'SET_VAULTS_POSITIONS_LOADED':
      return { ...state, isVaultsPositionsLoaded: action.payload }
    case 'SET_VAULTS_ACCOUNT_DATA':
      return { ...state, vaultsAccountData: action.payload }
    case 'SET_SELECTORS':
      return { ...state, selectors: action.payload }
    case 'SET_HELPERS':
      return { ...state, helpers: action.payload }
    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload }
    case 'SET_CONTRACTS_NETWORKS':
      return { ...state, contractsNetworks: action.payload }
    case 'SET_VAULTS_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    case 'SET_VAULTS_POSITIONS':
      return { ...state, vaultsPositions: action.payload }
    case 'SET_DISTRIBUTED_REWARDS':
      return { ...state, distributedRewards: action.payload }
    case 'SET_DISCOUNTED_FEES':
      return { ...state, discountedFees: action.payload }
    case 'SET_VAULTS':
      return { ...state, vaults: action.payload }
    case 'SET_VAULTS_CHAIN':
      return { ...state, vaultsChain: action.payload }
    case 'SET_VAULTS_NETWORKS':
      return { ...state, vaultsNetworks: action.payload }
    case 'SET_APRS':
      return { ...state, aprs: action.payload }
    case 'SET_INTEREST_BEARING_TOKENS':
      return { ...state, interestBearingTokens: action.payload }
    case 'SET_STAKING_DATA':
      return { ...state, stakingData: action.payload }
    case 'SET_FEES':
      return { ...state, fees: action.payload }
    case 'SET_BASE_APRS':
      return { ...state, baseAprs: action.payload }
    case 'SET_APR_RATIOS':
      return { ...state, aprRatios: action.payload }
    case 'SET_ALLOCATIONS':
      return { ...state, allocations: action.payload }
    case 'SET_LAST_HARVESTS':
      return { ...state, lastHarvests: action.payload }
    case 'SET_VAULTS_COLLECTED_FEES':
      return { ...state, vaultsCollectedFees: action.payload }
    case 'SET_HISTORICAL_RATES':
      return { ...state, historicalRates: action.payload }
    case 'SET_HISTORICAL_TVLS':
      return { ...state, historicalTvls: action.payload }
    case 'SET_HISTORICAL_TVLS_USD':
      return { ...state, historicalTvlsUsd: action.payload }
    case 'SET_ADDITIONAL_APRS':
      return { ...state, additionalAprs: action.payload }
    case 'SET_PROTOCOLS_APRS':
      return { ...state, protocolsAprs: action.payload }
    case 'SET_HISTORICAL_PRICES':
      return { ...state, historicalPrices: action.payload }
    case 'SET_HISTORICAL_PRICES_USD':
      return { ...state, historicalPricesUsd: action.payload }
    case 'SET_BALANCES':
      return { ...state, balances: action.payload }
    case 'SET_MATIC_NTFS':
      return { ...state, maticNFTs: action.payload }
    case 'SET_ETHENA_COOLDOWNS':
      return { ...state, ethenaCooldowns: action.payload }
    case 'SET_GAUGES_DATA':
      return { ...state, gaugesData: action.payload }
    case 'SET_REWARDS':
      return { ...state, rewards: action.payload }
    case 'SET_VAULTS_REWARDS':
      return { ...state, vaultsRewards: action.payload }
    case 'SET_GAUGES_REWARDS':
      return { ...state, gaugesRewards: action.payload }
    case 'SET_BALANCES_USD':
      return { ...state, balancesUsd: action.payload }
    case 'SET_VAULTS_PRICES':
      return { ...state, vaultsPrices: action.payload }
    case 'SET_VAULTS_REQUESTS':
      return { ...state, vaultsRequests: action.payload }
    case 'SET_PRICES_USD':
      return { ...state, pricesUsd: action.payload }
    case 'SET_TOTAL_SUPPLIES':
      return { ...state, totalSupplies: action.payload }
    case 'SET_APRS_BREAKDOWN':
      return { ...state, aprsBreakdown: action.payload }
    case 'SET_ASSETS_DATA':
      // console.log('Generate assets data', state.pricesUsd, action.payload['0xc8e6ca6e96a326dc448307a5fde90a0b21fd7f80'].priceUsd.toString(), currTime)
      return { ...state, assetsData: action.payload, assetsDataTimestamp: currTime }
    case 'SET_ASSETS_DATA_IF_EMPTY':
      if (isEmpty(state.assetsData)) {
        return { ...state, assetsData: action.payload }
      } else {
        return state
      }
    case 'SET_ASSET_DATA':
      return {
        ...state,
        assetsData: {
          ...state.assetsData,
          [action.payload.assetId.toLowerCase()]: {
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

export function PortfolioProvider({ children }: ProviderProps) {
  const cacheProvider = useCacheProvider()
  const { environment } = useThemeProvider()
  const { authCode } = useAuthCodeProvider()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { state: { lastTransaction } } = useTransactionManager()
  const { web3, web3Chains, web3Rpc, multiCall } = useWeb3Provider()
  const runningEffects = useRef<Record<string, boolean | number | string | undefined>>({})
  const { walletInitialized, disconnecting, connecting, account, prevAccount, chainId, prevChainId, explorer } = useWalletProvider()
  const [storedHistoricalPricesUsd, setHistoricalPricesUsd, , storedHistoricalPricesUsdLoaded] = useLocalForge('historicalPricesUsd', historicalPricesUsd)

  const accountChanged = useMemo(() => {
    return !!account && !!prevAccount && account.address !== prevAccount.address
  }, [account, prevAccount])

  const networkChanged = useMemo(() => {
    return !!chainId && !!prevChainId && +chainId !== +prevChainId
  }, [chainId, prevChainId])

  // console.log('accountChanged', accountChanged, 'chainId', chainId, 'prevChainId', prevChainId, 'networkChanged', networkChanged)

  const generateAssetsData = (vaults: Vault[]) => {
    const assetData = vaults.reduce((assets: Assets, vault: Vault) => {
      const vaultAssetsData = vault.getAssetsData()
      const status = ("status" in vault) && vault.status ? vault.status : 'production'
      const chainId = +vault.chainId

      // Add assets IDs
      const vaultAssetsDataWithIds = Object.keys(vaultAssetsData).reduce((vaultAssetsDataWithIds: Assets, assetId: AssetId) => {
        vaultAssetsDataWithIds[assetId] = {
          id: assetId,
          ...vaultAssetsData[assetId],
          status,
          chainId
        }
        return vaultAssetsDataWithIds
      }, {})

      return { ...assets, ...vaultAssetsDataWithIds }
    }, {})

    // console.log('assetData', vaults, assetData)

    return assetData
  }

  const selectVaultById = useCallback((vaultId: AssetId | undefined): Vault | null => {
    return state.vaults ? state.vaults.find((vault: Vault) => vault.id.toLowerCase() === vaultId?.toLowerCase()) || null : null
  }, [state.vaults])

  const selectVaultByCdoAddress = useCallback((cdoAddress: string): TrancheVault | null => {
    return state.vaults ? state.vaults.find((vault: TrancheVault) => ("cdoConfig" in vault) && cmpAddrs(vault.cdoConfig.address, cdoAddress)) || null : null
  }, [state.vaults])

  const selectVaultNetworkById = useCallback((chainId: any, vaultId: AssetId | undefined): Vault | null => {
    return state.vaultsNetworks && state.vaultsNetworks[chainId] ? state.vaultsNetworks[chainId].find((vault: Vault) => vault.id.toLowerCase() === vaultId?.toLowerCase()) || null : null
  }, [state.vaultsNetworks])

  const selectNetworkByVaultId = useCallback((vaultId: AssetId): any | undefined => {
    return Object.keys(state.vaultsNetworks).find((chainId: any) => {
      return state.vaultsNetworks[chainId].find((vault: Vault) => vault.id.toLowerCase() === vaultId.toLowerCase())
    })
  }, [state.vaultsNetworks])

  const selectAssetById = useCallback((assetId: AssetId | undefined): Asset | null => {
    return assetId && state.assetsData ? state.assetsData[assetId.toLowerCase()] : null
  }, [state.assetsData])

  const selectVaultTransactions = useCallback((vaultId: AssetId | undefined): Transaction[] => {
    return vaultId && state.transactions ? state.transactions[vaultId.toLowerCase()] || [] : []
  }, [state.transactions])

  const selectAssetStrategies = useCallback((assetId: AssetId | undefined): string[] => {
    const vault = selectVaultById(assetId)

    if (vault instanceof TrancheVault) return [vault.type]
    if (!vault || !("tokenConfig" in vault) || !("protocols" in vault.tokenConfig)) return []

    return vault.tokenConfig.protocols.reduce((availableStrategies: string[], protocolConfig: IdleTokenProtocol) => {
      const asset = selectAssetById(protocolConfig.address)
      if (!asset || !asset?.type) return availableStrategies
      if (availableStrategies.includes(asset.type)) return availableStrategies
      return [...availableStrategies, asset.type]
    }, [])
  }, [selectVaultById, selectAssetById])

  const selectAssetHistoricalPriceByTimestamp = useCallback((assetId: AssetId | undefined, timestamp: string | number): HistoryData | null => {
    if (assetId && state.historicalPrices[assetId.toLowerCase()] && !isEmpty(state.historicalPrices[assetId.toLowerCase()])) {
      let price = state.historicalPrices[assetId.toLowerCase()].find((historyData: HistoryData) => +historyData.date === +timestamp)
      if (!price) {
        const latestPrice = sortArrayByKey(state.historicalPrices[assetId.toLowerCase()].filter((historyData: HistoryData) => +historyData.date < +timestamp), 'date', 'asc').pop()
        if (latestPrice) {
          price = latestPrice
        }
      }
      return price
    }
    return null
  }, [state.historicalPrices])

  const selectAssetHistoricalPriceUsdByTimestamp = useCallback((assetId: AssetId | undefined, timestamp: string | number): HistoryData | null => {
    if (assetId && state.historicalPricesUsd[assetId.toLowerCase()] && !isEmpty(state.historicalPricesUsd[assetId.toLowerCase()])) {
      let priceUsd = state.historicalPricesUsd[assetId.toLowerCase()].find((historyData: HistoryData) => +historyData.date === +timestamp)
      if (!priceUsd) {
        const latestPriceUsd = sortArrayByKey(state.historicalPricesUsd[assetId.toLowerCase()].filter((historyData: HistoryData) => +historyData.date < +timestamp), 'date', 'asc').pop()
        if (latestPriceUsd) {
          priceUsd = latestPriceUsd
        }
      }
      return priceUsd
    }
    return null
  }, [state.historicalPricesUsd])

  const selectAssetHistoricalPrices = useCallback((assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalPrices[assetId.toLowerCase()] ? state.historicalPrices[assetId.toLowerCase()] : null
  }, [state.historicalPrices])

  const selectAssetHistoricalRates = useCallback((assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalRates[assetId.toLowerCase()] ? state.historicalRates[assetId.toLowerCase()] : null
  }, [state.historicalRates])

  const selectAssetHistoricalTvls = useCallback((assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalTvls[assetId.toLowerCase()] ? state.historicalTvls[assetId.toLowerCase()] : null
  }, [state.historicalTvls])

  const selectAssetHistoricalTvlsUsd = useCallback((assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.historicalTvlsUsd[assetId.toLowerCase()] ? state.historicalTvlsUsd[assetId.toLowerCase()] : null
  }, [state.historicalTvlsUsd])

  const selectAssetInterestBearingTokens = useCallback((assetId: AssetId | undefined): Record<AssetId, HistoryData[]> | null => {
    return assetId && state.interestBearingTokens[assetId.toLowerCase()] ? state.interestBearingTokens[assetId.toLowerCase()] : null
  }, [state.interestBearingTokens])

  const selectAssetsByIds = useCallback((assetIds: AssetId[]): Asset[] | null => {
    const assetIdsLowerCase = assetIds.map(assetId => assetId && assetId.toLowerCase())
    return Object.keys(state.assetsData).filter(assetId => assetIdsLowerCase.includes(assetId)).map(assetId => state.assetsData[assetId])
  }, [state.assetsData])

  const selectVaultsAssetsByType = useCallback((vaultType: string): Asset[] | null => {
    const vaults = state.vaults ? state.vaults.filter((vault: Vault) => vault.type.toLowerCase() === vaultType.toLowerCase()) || null : null
    return Object.keys(state.assetsData).filter(assetId => vaults.map((vault: Vault) => vault.id.toLowerCase()).includes(assetId)).map(assetId => state.assetsData[assetId])
  }, [state.vaults, state.assetsData])

  const selectVaultsWithBalance = useCallback((vaultType: string | null = null): Vault[] | null => {
    return state.vaults ? state.vaults.filter((vault: Vault) => (!vaultType || vault.type.toLowerCase() === vaultType.toLowerCase()) && state.assetsData[vault.id.toLowerCase()] && state.assetsData[vault.id.toLowerCase()].balance && BNify(state.assetsData[vault.id.toLowerCase()].balance).gt(0)) || null : null
  }, [state.vaults, state.assetsData])

  const selectVaultsByType = useCallback((vaultType: string): Vault | null => {
    return state.vaults ? state.vaults.filter((vault: Vault) => vault.type.toLowerCase() === vaultType.toLowerCase()) || null : null
  }, [state.vaults])

  const selectVaultEpochData = useCallback((assetId: AssetId | undefined): EpochData | null => {
    return state.epochsData && assetId ? state.epochsData[assetId.toLowerCase()] || null : null
  }, [state.epochsData])

  const selectVaultGauge = useCallback((vaultId: string): Vault | null => {
    const vault = selectVaultById(vaultId)
    if (!vault || !("gaugeConfig" in vault) || !vault.gaugeConfig || vault.type === 'GG') return null
    return selectVaultById(vault.gaugeConfig?.address)
  }, [selectVaultById])

  const selectVaultPosition = useCallback((assetId: AssetId | undefined): VaultPosition | null => {
    if (!state.vaultsPositions || !assetId) return null
    return state.vaultsPositions[assetId.toLowerCase()] || null
  }, [state.vaultsPositions])

  const selectVaultPrice = useCallback((assetId: AssetId | undefined): BigNumber => {
    if (!state.vaultsPrices || !assetId) return BNify(1)
    return state.vaultsPrices[assetId.toLowerCase()] || BNify(1)
  }, [state.vaultsPrices])

  const selectAssetPriceUsd = useCallback((assetId: AssetId | undefined): BigNumber => {
    if (!state.pricesUsd || !assetId) return BNify(1)
    return state.pricesUsd[assetId.toLowerCase()] || BNify(1)
  }, [state.pricesUsd])

  const selectAssetTotalSupply = useCallback((assetId: AssetId | undefined): BigNumber => {
    if (!state.totalSupplies || !assetId) return BNify(0)
    return state.totalSupplies[assetId.toLowerCase()] || BNify(0)
  }, [state.totalSupplies])

  const selectAssetBalance = useCallback((assetId: AssetId | undefined): BigNumber => {
    if (!state.balances || !assetId) return BNify(0)
    return state.balances[assetId.toLowerCase()] || BNify(0)
  }, [state.balances])

  const selectAssetBalanceUsd = useCallback((assetId: AssetId | undefined): BigNumber => {
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

  const selectVaultsAssetsWithBalance = useCallback((vaultType: string | null = null, includeStakedAmount = true): Asset[] | null => {
    const vaultsWithBalance = state.vaults ? state.vaults.filter((vault: Vault) => {
      const assetBalance = selectAssetBalance(vault.id)
      const assetVaultPosition = selectVaultPosition(vault.id)
      const checkVaultType = vault.type !== 'underlying' && (!vaultType || vault.type.toLowerCase() === vaultType.toLowerCase())
      const vaultHasBalance = assetBalance.gt(0)
      const vaultHasStakedBalance = includeStakedAmount && BNify(assetVaultPosition?.underlying.staked).gt(0)
      return checkVaultType && (vaultHasBalance || vaultHasStakedBalance)
    }) : null
    return Object.keys(state.assetsData).filter((assetId: AssetId) => vaultsWithBalance.map((vault: Vault) => vault.id.toLowerCase()).includes(assetId)).map((assetId: AssetId) => state.assetsData[assetId])
  }, [state.vaults, state.assetsData, selectAssetBalance, selectVaultPosition])

  const vaultFunctionsHelper = useMemo((): VaultFunctionsHelper | null => {
    if (!chainId || !walletInitialized || !multiCall || isEmpty(state.contractsNetworks)) return null
    return new VaultFunctionsHelper({ chainId, web3, web3Chains, multiCall, explorer, cacheProvider, contracts: state.contractsNetworks })
  }, [chainId, web3, walletInitialized, web3Chains, multiCall, explorer, cacheProvider, state.contractsNetworks])

  const genericContractsHelper = useMemo((): GenericContractsHelper | null => {
    if (!chainId || !web3 || !multiCall || !state.contracts.length) return null
    return new GenericContractsHelper({ chainId, web3, multiCall, contracts: state.contracts })
  }, [chainId, web3, multiCall, state.contracts])

  const getUserTransactions = useCallback(async (startBlock: number, endBlock: string | number = 'latest', defaultChainId?: number, count = 0): Promise<EtherscanTransaction[]> => {
    if (!account?.address || !chainId || !web3Chains) return []

    const chainIdToUse = defaultChainId ? +defaultChainId : +chainId

    const explorer = explorers[networks[chainIdToUse].explorer]
    if (!explorer) return []

    const cacheKey = `${explorer.endpoints[chainIdToUse]}?module=account&action=tokentx&address=${account.address}`
    const cachedData = cacheProvider ? await cacheProvider.getCachedUrl(cacheKey) : null

    startBlock = cachedData ? cachedData.data.reduce((t: number, r: any) => Math.max(t, +r.blockNumber), 0) + 1 : startBlock

    const endpoint = `${explorer.endpoints[chainIdToUse]}?module=account&action=tokentx&address=${account.address}&startblock=${startBlock}&endblock=${endBlock}&sort=asc`
    const etherscanTransactions = await makeEtherscanApiRequest(endpoint, explorer.keys)

    if (!etherscanTransactions) return []

    const dataToCache = new Set()
    if (cachedData) {
      for (const tx of cachedData.data) {
        dataToCache.add(tx)
      }
    }
    for (const tx of etherscanTransactions) {
      dataToCache.add(tx)
    }

    if (cacheProvider) {
      cacheProvider.saveData(cacheKey, Array.from(dataToCache.values()), 0)
    }

    const userTransactions = Array.from(dataToCache.values()) as EtherscanTransaction[]

    const lastTxBlock = sortArrayByKey(userTransactions, 'blockNumber', 'desc').find((tx: EtherscanTransaction) => !!tx.blockNumber)?.blockNumber

    // console.log('getUserTransactions', 'count', count, 'startBlock', startBlock, 'endBlock', endBlock, 'lastTransaction', lastTransaction, 'cachedData', cachedData, 'endpoint', endpoint, 'etherscanTransactions', etherscanTransactions, 'userTransactions', userTransactions)

    // Integrate latest transactions from alchemy in case of data-gap from explorer APIs
    if (lastTxBlock) {
      const blockHex = '0x' + ((+lastTxBlock + 1).toString(16))
      try {
        const alchemyUserTransactions = await getAlchemyTransactionHistory(chainIdToUse, account.address, undefined, blockHex, 'latest')
        const alchemyUserTransactionsReceived = await getAlchemyTransactionHistory(chainIdToUse, undefined, account.address, blockHex, 'latest')
        // console.log('alchemyUserTransactions', chainIdToUse, account.address, parseInt(blockHex), alchemyUserTransactions)
        // console.log('alchemyUserTransactionsReceived', chainIdToUse, account.address, parseInt(blockHex), alchemyUserTransactionsReceived)

        // Add distrivuted rewards txs
        if (alchemyUserTransactionsReceived) {
          const distributedRewardsTxs = alchemyUserTransactionsReceived.filter((alchemyTx: AssetTransfersResult) => {
            let output = false
            state.vaults.filter((vault: Vault) => +vault.chainId === chainIdToUse).forEach((vault: Vault) => {
              if (("distributedTokens" in vault) && ("rewardsSenders" in vault) && !isEmpty(vault.distributedTokens) && !isEmpty(vault.rewardsSenders)) {
                const foundTx = vault.distributedTokens.map((distributedToken: UnderlyingTokenProps) => distributedToken.address?.toLowerCase()).includes((alchemyTx.rawContract.address as string).toLowerCase()) && (Object.keys(vault.rewardsSenders as RewardSenders) as Address[]).map(addr => addr.toLowerCase()).includes(alchemyTx.from.toLowerCase())
                if (foundTx) {
                  output = true
                }
              }
            })
            return output
          })

          // distributedRewardsTxs.forEach( (alchemyTx: AssetTransfersResult) => {
          for (let index = 0; index < distributedRewardsTxs.length; index++) {
            const alchemyTx: AssetTransfersResult = distributedRewardsTxs[index]
            const blockInfo = await web3Chains[chainIdToUse].eth.getBlock(+alchemyTx.blockNum)
            const distributedRewardTx: EtherscanTransaction = getEtherscanTransactionObject({
              blockNumber: parseInt('' + alchemyTx.blockNum),
              contractAddress: alchemyTx.rawContract.address,
              from: alchemyTx.from,
              hash: alchemyTx.hash,
              timeStamp: blockInfo.timestamp,
              to: account.address,
              tokenDecimal: +(alchemyTx.rawContract.decimal as string),
              tokenName: alchemyTx.asset,
              tokenSymbol: alchemyTx.asset,
              value: +(alchemyTx.rawContract.value as string)
            } as Record<keyof EtherscanTransaction, any>)

            userTransactions.push(distributedRewardTx)
            dataToCache.add(distributedRewardTx)
          }

          // console.log('distributedRewardsTxs', chainIdToUse, account.address, distributedRewardsTxs)
        }

        // Add deposit/redeems txs
        if (alchemyUserTransactions) {
          const redeemTxsHash: string[] = []
          const depositTxsHash: string[] = []

          alchemyUserTransactions.forEach((alchemyTx: AssetTransfersResult) => {
            const redeemVault = selectVaultById(alchemyTx.rawContract.address as string)
            const depositVault = selectVaultByCdoAddress(alchemyTx.to as string)

            if (redeemVault && "cdoConfig" in redeemVault) {
              redeemTxsHash.push(alchemyTx.hash.toLowerCase())
            } else if (depositVault && "vaultConfig" in depositVault) {
              depositTxsHash.push(alchemyTx.hash.toLowerCase())
            }
          })

          // console.log('redeemTxsHash', chainIdToUse, account.address, redeemTxsHash)
          // console.log('depositTxsHash', chainIdToUse, account.address, depositTxsHash)

          const txsHash = arrayUnique(redeemTxsHash.concat(depositTxsHash))

          // @ts-ignore
          const transactionReceipts: TransactionReceipt[] = await Promise.all(txsHash.map((txHash: string) => web3Chains[chainIdToUse].eth.getTransactionReceipt(txHash)))

          // transactionReceipts.forEach( (txReceipt: TransactionReceipt) => {
          for (let index = 0; index < transactionReceipts.length; index++) {
            const txReceipt: TransactionReceipt = transactionReceipts[index]
            const vault = selectVaultById(txReceipt.to) || selectVaultByCdoAddress(txReceipt.to)
            // Handle deposit
            if (depositTxsHash.includes(txReceipt.transactionHash.toLowerCase())) {
              // console.log('DEPOSIT', chainIdToUse, txReceipt)
              if (vault && ("underlyingToken" in vault) && vault.underlyingToken?.address) {
                const underlyingTokenLog = txReceipt.logs.find((log: Log) => cmpAddrs(log.address, vault.underlyingToken?.address) && parseInt(log.data) > 0)
                const idleTokenLog = txReceipt.logs.find((log: Log) => {
                  if (vault instanceof TrancheVault) {
                    return cmpAddrs(log.address, vault.vaultConfig.Tranches.AA.address) || cmpAddrs(log.address, vault.vaultConfig.Tranches.BB.address)
                  } else {
                    return cmpAddrs(log.address, vault.id)
                  }
                })
                if (idleTokenLog && underlyingTokenLog) {
                  const idleAmount = BNify(parseInt(idleTokenLog.data)).toFixed(0)
                  const underlyingAmount = BNify(parseInt(underlyingTokenLog.data)).toFixed(0)

                  const blockInfo = await web3Chains[chainIdToUse].eth.getBlock(txReceipt.blockNumber)

                  // console.log('DEPOSIT', chainIdToUse, txReceipt, idleTokenLog, underlyingTokenLog, idleAmount, underlyingAmount)

                  const tx1: EtherscanTransaction = getEtherscanTransactionObject({
                    blockHash: txReceipt.blockHash,
                    blockNumber: parseInt('' + txReceipt.blockNumber),
                    contractAddress: underlyingTokenLog.address,
                    from: account.address,
                    hash: txReceipt.transactionHash,
                    timeStamp: blockInfo.timestamp,
                    to: txReceipt.to,
                    tokenDecimal: (vault.underlyingToken?.decimals || 18),
                    tokenName: vault.underlyingToken?.token,
                    tokenSymbol: vault.underlyingToken?.token,
                    transactionIndex: txReceipt.transactionIndex,
                    value: underlyingAmount
                  } as Record<keyof EtherscanTransaction, any>)

                  const tx2: EtherscanTransaction = getEtherscanTransactionObject({
                    blockHash: txReceipt.blockHash,
                    blockNumber: parseInt('' + txReceipt.blockNumber),
                    contractAddress: idleTokenLog.address,
                    from: ZERO_ADDRESS,
                    hash: txReceipt.transactionHash,
                    timeStamp: blockInfo.timestamp,
                    to: account.address,
                    tokenDecimal: '18',
                    tokenName: vault.underlyingToken?.token,
                    tokenSymbol: vault.underlyingToken?.token,
                    transactionIndex: txReceipt.transactionIndex,
                    value: idleAmount,
                  } as Record<keyof EtherscanTransaction, any>)

                  // Add txs
                  userTransactions.push(tx1)
                  userTransactions.push(tx2)
                  dataToCache.add(tx1)
                  dataToCache.add(tx2)
                }
              }
            } else if (redeemTxsHash.includes(txReceipt.transactionHash.toLowerCase())) {
              // console.log('REDEEM', chainIdToUse, txReceipt)

              if (vault && ("underlyingToken" in vault) && vault.underlyingToken?.address) {
                const underlyingTokenLog = txReceipt.logs.find((log: Log) => cmpAddrs(log.address, vault.underlyingToken?.address) && log.topics.find((topic: string) => topic.toLowerCase().includes(account.address.replace('0x', '').toLowerCase())) && parseInt(log.data) > 0)
                const idleTokenLog = txReceipt.logs.find((log: Log) => {
                  const check1 = log.topics.find((topic: string) => topic.toLowerCase().includes(account.address.replace('0x', '').toLowerCase()))
                  if (vault instanceof TrancheVault) {
                    return check1 && (cmpAddrs(log.address, vault.vaultConfig.Tranches.AA.address) || cmpAddrs(log.address, vault.vaultConfig.Tranches.BB.address))
                  } else {
                    return check1 && cmpAddrs(log.address, vault.id)
                  }
                })
                if (idleTokenLog && underlyingTokenLog) {
                  const idleAmount = BNify(parseInt(idleTokenLog.data)).toFixed(0)
                  const underlyingAmount = BNify(parseInt(underlyingTokenLog.data)).toFixed(0)

                  const blockInfo = await web3Chains[chainIdToUse].eth.getBlock(txReceipt.blockNumber)

                  // console.log('REDEEM', chainIdToUse, txReceipt, idleTokenLog, underlyingTokenLog, idleAmount, underlyingAmount)

                  const tx1: EtherscanTransaction = getEtherscanTransactionObject({
                    blockHash: txReceipt.blockHash,
                    blockNumber: '' + parseInt('' + txReceipt.blockNumber),
                    contractAddress: txReceipt.to,
                    from: account.address,
                    hash: txReceipt.transactionHash,
                    timeStamp: blockInfo.timestamp,
                    to: account.address,
                    tokenDecimal: (vault.underlyingToken?.decimals || 18),
                    tokenName: vault.underlyingToken?.token,
                    tokenSymbol: vault.underlyingToken?.token,
                    transactionIndex: txReceipt.transactionIndex,
                    value: underlyingAmount,
                  } as Record<keyof EtherscanTransaction, any>)

                  const tx2: EtherscanTransaction = getEtherscanTransactionObject({
                    blockHash: txReceipt.blockHash,
                    blockNumber: '' + parseInt('' + txReceipt.blockNumber),
                    contractAddress: vault.id,
                    from: account.address,
                    hash: txReceipt.transactionHash,
                    timeStamp: blockInfo.timestamp,
                    to: ZERO_ADDRESS,
                    tokenDecimal: '18',
                    tokenName: vault.underlyingToken?.token,
                    tokenSymbol: vault.underlyingToken?.token,
                    transactionIndex: txReceipt.transactionIndex,
                    value: idleAmount,
                  } as Record<keyof EtherscanTransaction, any>)

                  // Add txs
                  userTransactions.push(tx1)
                  userTransactions.push(tx2)
                  dataToCache.add(tx1)
                  dataToCache.add(tx2)
                }
              }
            }
          }
          // const vaultsTransactions = await Promise.all( vaults.map( (vaultAddress: string) => getAlchemyTransactionHistory(chainIdToUse, vaultAddress, undefined, blockHex, 'latest')))
          // console.log('vaultsTransactions', vaults, chainIdToUse, account.address, vaultsTransactions)
        }
      } catch (err) {
        // console.log('alchemyUserTransactions - ERROR', chainIdToUse, account.address, blockHex, err)
      }
    }

    if (cacheProvider) {
      cacheProvider.saveData(cacheKey, Array.from(dataToCache.values()), 0)
    }

    // Look for lastTransaction hash, otherwise wait and retry
    if (lastTransaction?.hash) {
      const lastTransactionFound = userTransactions.find((tx: EtherscanTransaction) => tx.hash.toLowerCase() === lastTransaction?.hash?.toLowerCase())
      if (!lastTransactionFound && count <= 10) {
        // console.log('lastTransaction hash NOT FOUND, wait 1s and try again, COUNT: ', count)
        await asyncWait(1000)
        return await getUserTransactions(startBlock, endBlock, chainIdToUse, count + 1)
      }
    }

    // Get functionName
    const txlistStartBlock = sortArrayByKey(userTransactions, 'blockNumber', 'asc').find((tx: EtherscanTransaction) => !tx.functionName)?.blockNumber
    const txlistEndBlock = sortArrayByKey(userTransactions, 'blockNumber', 'desc').find((tx: EtherscanTransaction) => !tx.functionName)?.blockNumber

    // Get txlist and retrieve functionName
    if (txlistStartBlock && txlistEndBlock) {
      const endpoint = `${explorer.endpoints[chainIdToUse]}?module=account&action=txlist&address=${account.address}&startblock=${txlistStartBlock}&endblock=${txlistEndBlock}&sort=asc`
      const txsList = await makeEtherscanApiRequest(endpoint, explorer.keys)
      // console.log('txsList', txlistStartBlock, txlistEndBlock, txsList)
      txsList?.filter((tx: any) => !!tx.functionName).forEach((tx: any) => {
        const etherscanTxs = userTransactions.filter((etherscanTx: EtherscanTransaction) => cmpAddrs(etherscanTx.hash, tx.hash))
        etherscanTxs.forEach((etherscanTx: EtherscanTransaction) => {
          if (etherscanTx) {
            etherscanTx.input = tx.input
            etherscanTx.methodId = tx.methodId
            etherscanTx.functionName = tx.functionName
            // console.log('txlist', etherscanTx.hash, etherscanTx)
          }
        })
      })
    }

    if (cacheProvider) {
      cacheProvider.saveData(cacheKey, userTransactions, 0)
    }

    return userTransactions
  }, [account?.address, lastTransaction, web3Chains, chainId, cacheProvider, selectVaultById, selectVaultByCdoAddress, state.vaults])

  /**
   * Get vaults data based on connected account
   */
  const getVaultsAccountData = useCallback(async (vaults: Vault[]): Promise<VaultsAccountData> => {

    const output: VaultsAccountData =  {
      walletAllowed: {},
      maxWithdrawable: {},
      creditVaultsDepositRequests: {},
      creditVaultsWithdrawRequests: {},
    }

    if (!account || !multiCall || !web3Chains) return output

    const rawCallsByChainId = vaults.filter((vault: Vault) => checkAddress(vault.id)).reduce((rawCalls: Record<number, CallData[][]>, vault: Vault): Record<number, CallData[][]> => {
      
      const aggregatedRawCalls = [
        // ("getUserDepositRequestCalls" in vault) ? vault.getUserDepositRequestCalls(account.address) : [],
        ("getUserWithdrawRequestCalls" in vault) ? vault.getUserWithdrawRequestCalls(account.address) : [],
        ("getUserMaxWithdrawableCalls" in vault) ? vault.getUserMaxWithdrawableCalls(account.address) : [],
        ("getUserLastWithdrawRequestCalls" in vault) ? vault.getUserLastWithdrawRequestCalls(account.address) : [],
        ("getUserInstantWithdrawRequestCalls" in vault) ? vault.getUserInstantWithdrawRequestCalls(account.address) : [],
      ]

      if (!rawCalls[vault.chainId]) {
        rawCalls[vault.chainId] = []
      }

      aggregatedRawCalls.forEach((calls: ContractRawCall[], index: number) => {
        // Init array index
        if (rawCalls[vault.chainId].length <= index) {
          rawCalls[vault.chainId].push([])
        }

        calls.forEach((rawCall: ContractRawCall) => {
          const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
          if (callData) {
            rawCalls[vault.chainId][index].push(callData)
          }
        })
      })

      return rawCalls
    }, {})

    const resultsByChainId = await Promise.all(Object.keys(rawCallsByChainId).map(chainId => multiCall.executeMultipleBatches(rawCallsByChainId[+chainId], +chainId, web3Chains[chainId])))

    Object.keys(rawCallsByChainId).forEach((chainId, resultIndex) => {
      const [
        withdrawRequestResults,
        maxWithdrawableResults,
        lastWithdrawRequestResults,
        instantWithdrawRequestResults,
        // walletAllowedResults
      ]: DecodedResult[][] = resultsByChainId[resultIndex]

      const lastWithdrawRequests: Record<AssetId, number> = lastWithdrawRequestResults ? lastWithdrawRequestResults.reduce( (acc: Record<AssetId, number>, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        return {
          ...acc,
          [assetId]: callResult.data
        }
      }, {}) : {}

      if (withdrawRequestResults){
        output.creditVaultsWithdrawRequests = withdrawRequestResults.reduce( (acc: VaultsAccountData["creditVaultsWithdrawRequests"], callResult: DecodedResult) => {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          if (bnOrZero(callResult.data).lte(0)) return acc
          return {
            ...acc,
            [assetId]: [
              ...(acc?.[assetId] || []),
              {
                amount: bnOrZero(callResult.data),
                isInstant: false,
                epochNumber: bnOrZero(lastWithdrawRequests[assetId]).toNumber()
              }
            ]
          }
        }, output.creditVaultsWithdrawRequests)
      }

      if (maxWithdrawableResults){
        output.maxWithdrawable = maxWithdrawableResults.reduce( (acc: VaultsAccountData["maxWithdrawable"], callResult: DecodedResult) => {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          if (bnOrZero(callResult.data).lte(0)) return acc
          return {
            ...acc,
            [assetId]: bnOrZero(callResult.data)
          }
        }, output.maxWithdrawable)
      }

      if (instantWithdrawRequestResults){
        output.creditVaultsWithdrawRequests = instantWithdrawRequestResults.reduce( (acc: VaultsAccountData["creditVaultsWithdrawRequests"], callResult: DecodedResult) => {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          if (bnOrZero(callResult.data).lte(0)) return acc
          return {
            ...acc,
            [assetId]: [
              ...(acc?.[assetId] || []),
              {
                amount: bnOrZero(callResult.data),
                isInstant: true,
                epochNumber: 0
              }
            ]
          }
        }, output.creditVaultsWithdrawRequests)
      }

      /*
      if (walletAllowedResults){
        output.walletAllowed = instantWithdrawRequestResults.reduce( (acc: VaultsAccountData["walletAllowed"], callResult: DecodedResult) => {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          return {
            ...acc,
            [assetId]: !!callResult.data
          }
        }, output.walletAllowed)
      }
      */
    })

    return output

  }, [account, multiCall, web3Chains])

  const getVaultsPositions = useCallback(async (vaults: Vault[]): Promise<VaultsPositions> => {

    const output: VaultsPositions = {
      discountedFees: {},
      vaultsPositions: {},
      distributedRewards: {},
      vaultsTransactions: {}
    }

    if (!account?.address || !web3Chains) return output

    const startTimestamp = Date.now()
    const userChainsTransactions: Record<string, EtherscanTransaction[]> = {}

    await asyncForEach(Object.keys(web3Chains), async (chainId: string) => {

      const chainVaults = vaults.filter((vault: Vault) => +vault.chainId === +chainId)

      const startBlock = chainVaults.reduce((startBlock: number, vault: Vault): number => {
        if (!("getBlockNumber" in vault)) return startBlock
        const vaultBlockNumber = vault.getBlockNumber()
        if (!startBlock) return vaultBlockNumber
        return Math.min(startBlock, vaultBlockNumber)
      }, 0)

      const endBlock = 'latest'
      const etherscanTransactions = await getUserTransactions(startBlock, endBlock, +chainId)

      // Save user transactions for later
      userChainsTransactions[chainId] = etherscanTransactions

      // console.log('etherscanTransactions', chainId, account.address, startBlock, endBlock, etherscanTransactions)

      await asyncForEach(
        chainVaults,
        async (vault: Vault) => {
          if ("getTransactions" in vault) {
            output.vaultsTransactions[vault.id] = await vault.getTransactions(account.address, etherscanTransactions)
          }
        }
      )
    })

    output.vaultsPositions = Object.keys(output.vaultsTransactions).reduce((vaultsPositions: Record<AssetId, VaultPosition>, assetId: AssetId) => {
      const transactions = output.vaultsTransactions[assetId]

      if (!transactions || !transactions.length) return vaultsPositions

      let firstDepositTx: any = null
      // const asset = selectAssetById(assetId)
      const vaultPrice = selectVaultPrice(assetId)
      const vaultEpochData = selectVaultEpochData(assetId)

      const depositsInfo = transactions.reduce((depositsInfo: { balancePeriods: any[], depositedAmount: BigNumber, depositedIdleAmount: BigNumber, totalDeposits: BigNumber, depositedWithRefAmount: BigNumber, referral?: string | null }, transaction: Transaction, index: number) => {
        switch (transaction.action) {
          case 'deposit':
          case 'stake':
            if (!firstDepositTx) {
              firstDepositTx = transaction
            }
            depositsInfo.totalDeposits = depositsInfo.totalDeposits.plus(transaction.underlyingAmount)
            depositsInfo.depositedAmount = depositsInfo.depositedAmount.plus(transaction.underlyingAmount)
            depositsInfo.depositedIdleAmount = depositsInfo.depositedIdleAmount.plus(transaction.idleAmount)

            // Deposit with referral
            if (checkAddress(transaction.referral)) {
              depositsInfo.referral = transaction.referral
              depositsInfo.depositedWithRefAmount = depositsInfo.depositedWithRefAmount.plus(transaction.underlyingAmount)
            }
            break;
          case 'redeem':
          case 'unstake':
            depositsInfo.depositedAmount = BigNumber.maximum(0, depositsInfo.depositedAmount.minus(transaction.underlyingAmount))
            depositsInfo.depositedIdleAmount = BigNumber.maximum(0, depositsInfo.depositedIdleAmount.minus(transaction.idleAmount))
            if (depositsInfo.depositedIdleAmount.lte(0)) {
              firstDepositTx = null
              depositsInfo.referral = null
              depositsInfo.balancePeriods = []
              depositsInfo.totalDeposits = BNify(0)
              depositsInfo.depositedAmount = BNify(0)
              depositsInfo.depositedWithRefAmount = BNify(0)
            } else if (depositsInfo.depositedAmount.lte(0)) {
              depositsInfo.depositedAmount = depositsInfo.depositedIdleAmount.times(transaction.idlePrice)
              // Track referral
              if (depositsInfo.depositedWithRefAmount.gt(0)) {
                depositsInfo.depositedWithRefAmount = depositsInfo.depositedAmount
              }
            }
            break;
          default:
            break;
        }

        // console.log(assetId, transaction.action, transaction.underlyingAmount.toString(), transaction.idleAmount.toString(), depositsInfo.depositedAmount.toString(), depositsInfo.depositedIdleAmount.toString())

        // Update last period
        if (depositsInfo.balancePeriods.length > 0) {
          const lastBalancePeriod = depositsInfo.balancePeriods[depositsInfo.balancePeriods.length - 1]

          lastBalancePeriod.duration = +transaction.timeStamp - lastBalancePeriod.timeStamp
          lastBalancePeriod.earningsPercentage = transaction.idlePrice.div(lastBalancePeriod.idlePrice).minus(1)
          lastBalancePeriod.realizedApr = BigNumber.maximum(0, lastBalancePeriod.earningsPercentage.times(31536000).div(lastBalancePeriod.duration))
          lastBalancePeriod.realizedApy = apr2apy(lastBalancePeriod.realizedApr).times(100)
          // console.log(assetId, vaultEpochData, transaction.timeStamp, lastBalancePeriod.timeStamp, lastBalancePeriod)
        }

        // Add period
        if (depositsInfo.depositedAmount.gt(0)) {
          // Update period for last transactions
          let endTimestamp = Date.now()
          // Get epoch date instead of current
          if (vaultEpochData) {
            if (toDayjs(vaultEpochData.epochEndDate).isAfter(endTimestamp)) {
              endTimestamp = vaultEpochData.epochStartDate
            } else {
              endTimestamp = vaultEpochData.epochEndDate
            }
          }

          const duration = index === transactions.length - 1 ? Math.floor(endTimestamp / 1000) - (+transaction.timeStamp) : 0
          const earningsPercentage = duration ? vaultPrice.div(transaction.idlePrice).minus(1) : BNify(0)
          const realizedApr = duration ? BigNumber.maximum(0, earningsPercentage.times(31536000).div(duration)) : BNify(0)
          const realizedApy = realizedApr ? apr2apy(realizedApr).times(100) : BNify(0)

          if (duration >= 86400 || index < transactions.length - 1) {
            depositsInfo.balancePeriods.push({
              duration,
              realizedApy,
              realizedApr,
              earningsPercentage,
              idlePrice: transaction.idlePrice,
              timeStamp: +transaction.timeStamp,
              blockNumber: transaction.blockNumber,
              balance: depositsInfo.depositedAmount
            })
          }
        }

        return depositsInfo
      }, {
        referral: null,
        balancePeriods: [],
        totalDeposits: BNify(0),
        depositedAmount: BNify(0),
        depositedIdleAmount: BNify(0),
        depositedWithRefAmount: BNify(0)
      })

      const { balancePeriods, depositedAmount, depositedIdleAmount, depositedWithRefAmount, referral } = depositsInfo

      if (depositedIdleAmount.lte(0)) return vaultsPositions

      let stakedAmount = BNify(0);
      let vaultBalance = selectAssetBalance(assetId)
      const assetPriceUsd = selectAssetPriceUsd(assetId)
      const vaultTotalSupply = selectAssetTotalSupply(assetId)
      const depositDuration = firstDepositTx ? Math.round(Date.now() / 1000) - parseInt(firstDepositTx.timeStamp) : 0

      // Add gauge balance to vault balance
      const gauge = selectVaultGauge(assetId)
      if (gauge) {
        stakedAmount = selectAssetBalance(gauge.id)
        vaultBalance = vaultBalance.plus(stakedAmount)
      }

      const poolShare = depositedIdleAmount.div(vaultTotalSupply)

      // Wait for balances to be loaded
      if (vaultBalance.lte(0)) return vaultsPositions

      const realizedAprParams = balancePeriods.reduce((realizedAprParams: { weight: BigNumber, sumAmount: BigNumber }, balancePeriod: any) => {
        const denom = BNify(balancePeriod.balance).times(balancePeriod.duration)
        realizedAprParams.weight = realizedAprParams.weight.plus(balancePeriod.realizedApr.times(denom))
        realizedAprParams.sumAmount = realizedAprParams.sumAmount.plus(denom)
        return realizedAprParams
      }, {
        weight: BNify(0),
        sumAmount: BNify(0)
      })

      const realizedApr = realizedAprParams.weight.div(realizedAprParams.sumAmount)
      const realizedApy = apr2apy(realizedApr).times(100)

      const redeemableAmount = vaultBalance.times(vaultPrice)
      const earningsAmount = redeemableAmount.minus(depositedAmount)
      const earningsPercentage = redeemableAmount.div(depositedAmount).minus(1)
      const avgBuyPrice = BigNumber.maximum(1, vaultPrice.div(earningsPercentage.plus(1)))

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
        redeemable: redeemableAmount,
        depositedWithRef: depositedWithRefAmount
      }

      const usd = {
        rewards: BNify(0),
        staked: stakedAmount.times(assetPriceUsd),
        earnings: earningsAmount.times(assetPriceUsd),
        deposited: depositedAmount.times(assetPriceUsd),
        redeemable: redeemableAmount.times(assetPriceUsd),
        depositedWithRef: depositedWithRefAmount.times(assetPriceUsd)
      }

      vaultsPositions[assetId] = {
        usd,
        idle,
        referral,
        poolShare,
        underlying,
        realizedApy,
        avgBuyPrice,
        balancePeriods,
        firstDepositTx,
        depositDuration,
        earningsPercentage
      }

      return vaultsPositions
    }, {})

    await asyncForEach(Object.keys(web3Chains), async (chainId: string) => {

      // const web3Chain = web3Chains[chainId]
      const chainVaults = vaults.filter((vault: Vault) => +vault.chainId === +chainId)
      const etherscanTransactions = userChainsTransactions[chainId]

      await asyncForEach(
        chainVaults,
        async (vault: Vault) => {
          if ("getDistributedRewards" in vault) {
            const vaultPosition = output.vaultsPositions[vault.id]
            const vaultStartBlock = vaultPosition && vaultPosition.firstDepositTx ? +vaultPosition.firstDepositTx.blockNumber : ("blockNumber" in vault ? vault.blockNumber : 0)
            const distributedRewardsTxs = vault.getDistributedRewards(account.address, etherscanTransactions, vaultStartBlock)
            output.distributedRewards[vault.id] = distributedRewardsTxs.reduce((distributedRewards: NonNullable<Asset["distributedRewards"]>, tx: EtherscanTransaction) => {
              const underlyingToken = selectUnderlyingTokenByAddress(+chainId, tx.contractAddress)
              if (!underlyingToken || !underlyingToken.address) return distributedRewards
              const underlyingTokenId = underlyingToken.address.toLowerCase()
              if (!distributedRewards[underlyingTokenId]) {
                distributedRewards[underlyingTokenId] = []
              }


              const distributedReward: DistributedReward = {
                tx,
                apr: null,
                hash: tx.hash,
                chainId: +chainId,
                assetId: underlyingTokenId,
                blockNumber: +tx.blockNumber,
                timeStamp: +tx.timeStamp * 1000,
                value: fixTokenDecimals(tx.value, underlyingToken.decimals || 18)
              }

              distributedRewards[underlyingTokenId].push(distributedReward)
              return distributedRewards
            }, {})
          }

          if ("getDiscountedFees" in vault) {
            const discountedFeesTxs = vault.getDiscountedFees(account.address, etherscanTransactions)
            output.discountedFees[vault.id] = discountedFeesTxs.reduce((discountedFees: NonNullable<Asset["discountedFees"]>, tx: EtherscanTransaction) => {
              const asset = selectAssetById(tx.contractAddress)
              if (!asset?.id) return discountedFees
              const discountedFee: DistributedReward = {
                tx,
                apr: null,
                hash: tx.hash,
                chainId: +chainId,
                assetId: asset.id as string,
                blockNumber: +tx.blockNumber,
                timeStamp: +tx.timeStamp * 1000,
                value: fixTokenDecimals(tx.value, asset.decimals || 18)
              }
              discountedFees.push(discountedFee)
              return discountedFees
            }, [])
          }
        }
      )
    })

    // eslint-disable-next-line
    console.log('VAULTS POSITIONS LOADED in', (Date.now() - startTimestamp) / 1000)
    // console.log('VaultsPositions', output)

    return output
  }, [account, web3Chains, /*cacheProvider,*/ selectAssetById, selectVaultPrice, selectVaultEpochData, selectAssetTotalSupply, selectAssetPriceUsd, selectAssetBalance, selectVaultGauge, getUserTransactions])

  const getStkIdleCalls = useCallback((): CallData[] => {
    if (!web3 || !multiCall || !state.contractsNetworks?.[STAKING_CHAINID].length) return []

    const StkIdleContract = state.contractsNetworks[STAKING_CHAINID].find((Contract: GenericContract) => Contract.name === 'stkIDLE')
    const StakingFeeDistributorContract = state.contractsNetworks[STAKING_CHAINID].find((Contract: GenericContract) => Contract.name === 'StakingFeeDistributor')

    if (!StkIdleContract || !StakingFeeDistributorContract) return []

    return [
      multiCall.getCallData(StkIdleContract.contract, 'supply'),
      multiCall.getCallData(StkIdleContract.contract, 'totalSupply'),
      multiCall.getCallData(StkIdleContract.contract, 'locked', [account?.address]),
      multiCall.getCallData(StkIdleContract.contract, 'balanceOf', [account?.address]),
      multiCall.getCallData(StakingFeeDistributorContract.contract, 'claim', [account?.address])
    ].filter((call): call is CallData => !!call)

  }, [account, web3, multiCall, state.contractsNetworks])

  // const getGaugesWeightsCalls = useCallback(async (vaults: Vault[]): Promise<Record<AssetId, BigNumber> | undefined> => {
  const getGaugesCalls = useCallback((vaults: Vault[]): CallData[][] | undefined => {
    if (!web3 || !chainId || !multiCall || !state.contracts.length) return
    const GaugeControllerContract = state.contracts.find((Contract: GenericContract) => Contract.name === 'GaugeController')
    if (!GaugeControllerContract) return

    const gaugesVaults = vaults.filter(vault => vault instanceof GaugeVault)

    const gaugeCalls = gaugesVaults.reduce((calls: CallData[][], vault: Vault): CallData[][] => {
      const rawCall1 = GaugeControllerContract.getRawCall('get_gauge_weight', [vault.id], vault.id)
      const callData1 = rawCall1 && multiCall.getDataFromRawCall(rawCall1.call, rawCall1)
      if (callData1) {
        calls[0].push(callData1)
      }

      const rawCall2 = GaugeControllerContract.getRawCall('time_weight', [vault.id], vault.id)
      const callData2 = rawCall2 && multiCall.getDataFromRawCall(rawCall2.call, rawCall2)
      if (callData2) {
        calls[1].push(callData2)
      }

      const rawCall3 = GaugeControllerContract.getRawCall('get_total_weight', [], vault.id)
      const callData3 = rawCall3 && multiCall.getDataFromRawCall(rawCall3.call, rawCall3)
      if (callData3) {
        calls[2].push(callData3)
      }

      return calls
    }, [[], [], []])

    // Add GaugeDistribution rate
    const GaugeDistributorContract = state.contracts.find((Contract: GenericContract) => Contract.name === 'GaugeDistributor')
    if (GaugeDistributorContract) {
      const rawCall = GaugeDistributorContract.getRawCall('rate', [])
      const callData = rawCall && multiCall.getDataFromRawCall(rawCall.call, rawCall)
      if (callData) {
        gaugeCalls.push([callData])
      }
    }

    return gaugeCalls

  }, [web3, chainId, multiCall, state.contracts])

  const getGearboxPointsEmissions = useCallback(async (vaults: Vault[]): Promise<VaultsOnchainData["gearboxPointsEmissions"]> => {
    if (!web3 || !multiCall || !web3Chains || isEmpty(state.contractsNetworks) || !vaultFunctionsHelper) return {}

    // Get gearbox vaults
    const gearboxVaults = vaults.filter((vault: Vault) => ("poolContract" in vault) && vault.poolContract && ("pointsEmission" in vault) && vault.pointsEmission && vault.chainId && vault.protocol === 'gearbox')

    const tokenSuppliesPromises: Record<AssetId, Promise<any>> = {}
    const pricesUsdCallsByChainId: Record<number, Record<AssetId, CallData>> = {}
    const expectedLiquidityCallsByChainId: Record<number, Record<AssetId, CallData>> = {}

    gearboxVaults.forEach((vault: Vault) => {
      if (("poolContract" in vault) && vault.poolContract) {
        const callData1 = multiCall.getCallData(vault.poolContract, 'expectedLiquidity', [], { vault, cdoAddress: vault.cdoConfig.address })
        if (callData1) {
          if (!expectedLiquidityCallsByChainId[vault.chainId]) {
            expectedLiquidityCallsByChainId[vault.chainId] = {}
          }
          expectedLiquidityCallsByChainId[vault.chainId][vault.cdoConfig.address] = callData1
        }
      }

      if (("pointsEmission" in vault) && vault.pointsEmission) {
        Object.keys(vault.pointsEmission).forEach(assetName => {
          const assetId = selectUnderlyingToken(vault.chainId, assetName)?.address;
          if (assetId) {
            tokenSuppliesPromises[assetId] = vaultFunctionsHelper.getGearboxTokenSupply(vault.chainId, assetId).then(tokenSupply => ({ cdoAddress: vault.cdoConfig.address, assetId, tokenSupply }))
          }
        })
      }

      if (("getPricesUsdCalls" in vault) && ("underlyingToken" in vault) && vault.underlyingToken?.address) {
        if (!pricesUsdCallsByChainId[vault.chainId]) {
          pricesUsdCallsByChainId[vault.chainId] = {}
        }
        const rawCalls: ContractRawCall[] = vault.getPricesUsdCalls(state.contractsNetworks[+vault.chainId])
        if (rawCalls.length) {
          const callData = multiCall.getDataFromRawCall(rawCalls[0].call, rawCalls[0])
          if (callData) {
            pricesUsdCallsByChainId[vault.chainId][vault.underlyingToken.address] = callData
          }
        }
      }
    })

    const [
      tokenSupplies,
      pricesUsdByChain,
      vaultsExpectedLiquidityByChain
    ] = await Promise.all([
      Promise.all(Object.values(tokenSuppliesPromises)),
      Promise.all(Object.keys(pricesUsdCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(pricesUsdCallsByChainId[+chainId]), true, +chainId, web3Chains[chainId]))),
      Promise.all(Object.keys(expectedLiquidityCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(expectedLiquidityCallsByChainId[+chainId]), true, +chainId, web3Chains[chainId])))
    ])

    // console.log('tokenSupplies', tokenSupplies)
    // console.log('pricesUsdByChain', pricesUsdByChain)
    // console.log('vaultsExpectedLiquidity', vaultsExpectedLiquidityByChain)

    return Object.keys(vaultsExpectedLiquidityByChain).reduce((pointsEmissions: Record<AssetId, Record<AssetId, RewardEmission>>, index: any) => {

      const pricesUsd = pricesUsdByChain[index]

      vaultsExpectedLiquidityByChain[index]?.forEach(result => {
        const vault = result.extraData.vault
        const cdoAddress = result.extraData.cdoAddress
        const expectedLiquidity = fixTokenDecimals(result.data, 18)
        const priceUsdResult = pricesUsd?.find((p: DecodedResult) => cmpAddrs(p.extraData.assetId, vault.id))
        const underlyingTokenPriceUsd = priceUsdResult?.data ? priceUsdResult.extraData.params.processResults(priceUsdResult.data, priceUsdResult.extraData.params) : BNify(1)

        Object.keys(vault.pointsEmission).forEach(tokenName => {
          const poolPoints = vault.pointsEmission[tokenName]
          const assetId = selectUnderlyingToken(vault.chainId, tokenName)?.address;
          const rewardId = selectUnderlyingToken(vault.chainId, poolPoints.assetName)?.address;
          if (assetId && rewardId) {
            const tokenSupply = bnOrZero(tokenSupplies.find((d: any) => cmpAddrs(d.cdoAddress, cdoAddress) && cmpAddrs(d.assetId, assetId))?.tokenSupply)
            const pointsPerToken = BNify(poolPoints.amount).times(tokenSupply).div(expectedLiquidity)
            if (!pointsEmissions[cdoAddress]) {
              pointsEmissions[cdoAddress] = {}
            }

            const pointsPer1000Usd = pointsPerToken.times(1000).div(underlyingTokenPriceUsd)
            let annualDistributionOn1000Usd = BNify(0)
            switch (poolPoints.duration) {
              case 'hour':
                annualDistributionOn1000Usd = pointsPer1000Usd.times(8760)
                break;
              case 'second':
                annualDistributionOn1000Usd = pointsPer1000Usd.times(SECONDS_IN_YEAR)
                break;
              default:
                break;
            }

            const rewardEmission: RewardEmission = {
              assetId: rewardId,
              totalSupply: BNify(0),
              annualDistributionOn1000Usd,
              annualDistribution: BNify(0),
              annualDistributionUsd: BNify(0),
              tooltip: poolPoints.tooltip || 'assets.assetDetails.tooltips.pointsEmissionOn1000Usd',
            }

            pointsEmissions[cdoAddress][rewardId] = rewardEmission
          }
        })
      })
      return pointsEmissions
    }, {})
  }, [web3, multiCall, web3Chains, state.contractsNetworks, vaultFunctionsHelper]);

  const getEthenaCooldowns = useCallback(async (vaults: Vault[], account: string): Promise<VaultsOnchainData["ethenaCooldowns"]> => {

    if (!account || !web3 || !multiCall || !web3Chains || isEmpty(state.contractsNetworks) || !vaultFunctionsHelper) return []

    const ethenaCooldownsEventsPromises = account ? vaults.reduce((promises: Map<AssetId, Promise<CdoEvents>>, vault: Vault): Map<AssetId, Promise<CdoEvents>> => {
      const assetKey = ("cdoConfig" in vault) ? vault.cdoConfig.address : vault.id
      if (promises.has(assetKey)) return promises
      const promise = vaultFunctionsHelper.getEthenaCooldownsEvents(vault, account)
      if (!promise) return promises
      promises.set(assetKey, promise as Promise<CdoEvents>)
      return promises
    }, new Map()) : new Map()

    const ethenaCooldownsEventsResults = await Promise.all(Array.from(ethenaCooldownsEventsPromises.values()))

    // Process vaults epochs
    const rawCallsByChainId = ethenaCooldownsEventsResults.reduce((rawCallsByChainId: Record<number, CallData[]>, cdoEvents: null | CdoEvents) => {
      if (!cdoEvents?.cdoId || isEmpty(cdoEvents.events)) return rawCallsByChainId

      const vault = cdoEvents.data.vault

      if (!("getPoolCustomCalls" in vault)) return rawCallsByChainId

      if (!rawCallsByChainId[vault.chainId]) {
        rawCallsByChainId[vault.chainId] = []
      }

      rawCallsByChainId[vault.chainId] = rawCallsByChainId[vault.chainId].concat(
        cdoEvents.events.map((event: EventLog) => {
          const rawCalls = vault.getPoolCustomCalls('cooldowns', [event.returnValues.contractAddress], { vault, contractAddress: event.returnValues.contractAddress })
          const rawCalls2 = vault.getPoolCustomCalls('convertToAssets', [BNify(1e18).toString()], { vault, contractAddress: event.returnValues.contractAddress })
          const callsData = rawCalls.map((rawCall: ContractRawCall) => multiCall.getDataFromRawCall(rawCall.call, rawCall))
          const callsData2 = rawCalls2.map((rawCall: ContractRawCall) => multiCall.getDataFromRawCall(rawCall.call, rawCall))
          return [...callsData, ...callsData2].flat()
        }).flat()
      )

      return rawCallsByChainId
    }, {})

    const [
      latestBlocks,
      resultsByChainId
    ] = await Promise.all([
      Promise.all(Object.keys(rawCallsByChainId).map(chainId => web3Chains[chainId].eth.getBlock('latest'))),
      Promise.all(Object.keys(rawCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(rawCallsByChainId[+chainId]), true, +chainId, web3Chains[chainId])))
    ])

    return resultsByChainId.reduce((ethenaCooldowns: VaultsOnchainData["ethenaCooldowns"], decodedResults: DecodedResult[] | null, index: number): VaultsOnchainData["ethenaCooldowns"] => {
      decodedResults?.forEach((decodedResult: DecodedResult) => {
        const vault = decodedResult.extraData.data.vault
        const contractAddress = decodedResult.extraData.data.contractAddress
        if (contractAddress) {
          const latestBlock = latestBlocks[index]
          const convertToAssetsResult = decodedResults.find((decodedResult2: DecodedResult) => decodedResult2.callData.method.includes("convertToAssets") && cmpAddrs(decodedResult2.extraData.data.contractAddress, contractAddress))
          if (bnOrZero(decodedResult?.data?.underlyingAmount).gt(0)) {
            const conversionRate = convertToAssetsResult?.data ? fixTokenDecimals(convertToAssetsResult.data, vault.underlyingToken?.decimals || 18) : BNify(1)
            const status = +decodedResult.data.cooldownEnd >= +latestBlock.timestamp ? 'pending' : 'available'
            // console.log(decodedResult.data.cooldownEnd, latestBlock.timestamp, status, conversionRate.toString())
            const ethenaCooldown: EthenaCooldown = {
              status,
              contractAddress,
              underlyingId: vault.underlyingToken?.address,
              cooldownEnd: +decodedResult.data.cooldownEnd * 1000,
              underlyingAmount: decodedResult.data.underlyingAmount,
              amount: fixTokenDecimals(decodedResult.data.underlyingAmount, vault.underlyingToken?.decimals || 18).times(conversionRate)
            }
            ethenaCooldowns.push(ethenaCooldown)
          }
        }
      })
      return ethenaCooldowns
    }, [])

  }, [web3, multiCall, web3Chains, state.contractsNetworks, vaultFunctionsHelper]);

  const getMorphoRewardsEmissions = useCallback(async (vaults: Vault[]): Promise<VaultsOnchainData["morphoRewardsEmissions"]> => {
    if (!web3 || !multiCall || !web3Chains || isEmpty(state.contractsNetworks)) return {}

    // Get morpho vaults
    const morphoVaults = vaults.filter((vault: Vault) => ("poolContract" in vault) && vault.poolContract && vault.chainId && vault.protocol === 'morpho')

    const rewardTokensCallsByChainId: Record<number, Record<AssetId, CallData>> = {}
    const withdrawQueueLengthCallsByChainId: Record<number, Record<AssetId, CallData>> = {}
    const morphoVaultsTotalSupplyCallsByChainId: Record<number, Record<AssetId, CallData>> = {}

    morphoVaults.forEach((vault: Vault) => {
      if (("strategyContract" in vault) && vault.strategyContract) {
        const callData = multiCall.getCallData(vault.strategyContract, 'getRewardTokens', [], { vault })
        if (callData) {
          if (!rewardTokensCallsByChainId[vault.chainId]) {
            rewardTokensCallsByChainId[vault.chainId] = {}
          }
          rewardTokensCallsByChainId[vault.chainId][vault.cdoConfig.address] = callData
        }
      }

      if (("poolContract" in vault) && vault.poolContract) {
        const callData1 = multiCall.getCallData(vault.poolContract, 'withdrawQueueLength', [], { vault })
        if (callData1) {
          if (!withdrawQueueLengthCallsByChainId[vault.chainId]) {
            withdrawQueueLengthCallsByChainId[vault.chainId] = {}
          }
          withdrawQueueLengthCallsByChainId[vault.chainId][vault.cdoConfig.address] = callData1
        }

        const callData2 = multiCall.getCallData(vault.poolContract, 'totalSupply', [], { vault })
        if (callData2) {
          if (!morphoVaultsTotalSupplyCallsByChainId[vault.chainId]) {
            morphoVaultsTotalSupplyCallsByChainId[vault.chainId] = {}
          }
          morphoVaultsTotalSupplyCallsByChainId[vault.chainId][vault.cdoConfig.address] = callData2
        }
      }
    })

    const morphoRewardsEmissionsContract = state.contractsNetworks[1].find((Contract: GenericContract) => Contract.name === 'MorphoRewardsEmissions')

    // Get RewardsEmissionSet events
    const rewardEmissionSetEvents = await morphoRewardsEmissionsContract.contract.getPastEvents('RewardsEmissionSet', {
      fromBlock: '18940297',
      toBlock: 'latest'
    });

    const morphoSenders = rewardEmissionSetEvents.reduce((morphoSenders: string[], event: EventLog) => {
      if (!morphoSenders.includes(event.returnValues.sender)) {
        morphoSenders.push(event.returnValues.sender)
      }
      return morphoSenders
    }, [])

    const urdAddresses = rewardEmissionSetEvents.reduce((urdAddresses: string[], event: EventLog) => {
      if (!urdAddresses.includes(event.returnValues.urd)) {
        urdAddresses.push(event.returnValues.urd)
      }
      return urdAddresses
    }, [])

    /*
    // Reward tokens calls
    const rewardTokensCallsByChainId = morphoVaults.reduce( (callsByChainId: Record<number, Record<AssetId, CallData>>, vault: Vault): Record<number, Record<AssetId, CallData>> => {
      if (!("strategyContract" in vault) || !vault.strategyContract) return callsByChainId
      const callData = multiCall.getCallData(vault.strategyContract, 'getRewardTokens', [], {vault})
      if (!callData) return callsByChainId
      if (!callsByChainId[vault.chainId]){
        callsByChainId[vault.chainId] = {}
      }
      callsByChainId[vault.chainId][vault.cdoConfig.address] = callData
      return callsByChainId
    }, {})

    const withdrawQueueLengthCallsByChainId = morphoVaults.reduce( (callsByChainId: Record<number, Record<AssetId, CallData>>, vault: Vault): Record<number, Record<AssetId, CallData>> => {
      if (!("poolContract" in vault) || !vault.poolContract) return callsByChainId
      const callData = multiCall.getCallData(vault.poolContract, 'withdrawQueueLength', [], {vault})
      if (!callData) return callsByChainId
      if (!callsByChainId[vault.chainId]){
        callsByChainId[vault.chainId] = {}
      }
      // callsByChainId[vault.chainId].push(callData)
      callsByChainId[vault.chainId][vault.cdoConfig.address] = callData
      return callsByChainId
    }, {})
    */

    // const withdrawQueueLengths = await multiCall.executeMulticalls(withdrawQueueLengthCalls, 1, web3Chains[1])
    // console.log('withdrawQueueLengthCallsByChainId', withdrawQueueLengthCallsByChainId)

    const [
      rewardTokensByChainId,
      withdrawQueueLengthsByChain,
      morphoVaultsTotalSupplyByChainId
    ] = await Promise.all([
      await Promise.all(Object.keys(rewardTokensCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(rewardTokensCallsByChainId[+chainId]), true, +chainId, web3Chains[chainId]))),
      await Promise.all(Object.keys(withdrawQueueLengthCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(withdrawQueueLengthCallsByChainId[+chainId]), true, +chainId, web3Chains[chainId]))),
      await Promise.all(Object.keys(morphoVaultsTotalSupplyCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(morphoVaultsTotalSupplyCallsByChainId[+chainId]), true, +chainId, web3Chains[chainId])))
    ])

    // console.log('rewardTokensByChainId', rewardTokensByChainId)
    // console.log('withdrawQueueLengthsByChain', withdrawQueueLengthsByChain)
    // console.log('morphoVaultsTotalSupplyByChainId', morphoVaultsTotalSupplyByChainId)

    // Get calls for rewards tokens conversion rates
    const rewardTokensConversionRateCalls = Object.keys(rewardTokensByChainId).reduce((callsByChainId: Record<number, Record<AssetId, CallData>>, index: any): Record<number, Record<AssetId, CallData>> => {
      const chainId = +Object.keys(rewardTokensCallsByChainId)[index]
      const genericContractsHelper = new GenericContractsHelper({ chainId, web3: web3Chains[chainId], multiCall, contracts: state.contractsNetworks[chainId] })
      rewardTokensByChainId[index]?.forEach(result => {
        const rewardTokens = result.data as string[]
        rewardTokens.forEach((rewardTokenAddress: string) => {
          const vault = result.extraData.vault
          const rewardToken = selectUnderlyingTokenByAddress(chainId, rewardTokenAddress)
          if (rewardToken?.address && !callsByChainId[vault.chainId]?.[rewardTokenAddress]) {
            const conversionRateParams = genericContractsHelper.getConversionRateParams(rewardToken)
            if (conversionRateParams) {
              const callData = multiCall.getDataFromRawCall(conversionRateParams.call, { assetId: rewardTokenAddress, params: conversionRateParams })
              if (callData) {
                if (!callsByChainId[vault.chainId]) {
                  callsByChainId[vault.chainId] = {}
                }
                callsByChainId[vault.chainId][rewardTokenAddress] = callData
              }
            }
          }
        })
      })
      return callsByChainId
    }, {})

    // Get reward tokens conversion rates
    const rewardTokensConversionRateByChain = await Promise.all(Object.keys(rewardTokensConversionRateCalls).map(chainId => multiCall.executeMulticalls(Object.values(rewardTokensConversionRateCalls[+chainId]), true, +chainId, web3Chains[chainId])))

    const rewardTokensConversionRates = Object.keys(rewardTokensConversionRateByChain).reduce((conversionRates: Balances, index: any) => {
      rewardTokensConversionRateByChain[index]?.forEach((callResult: DecodedResult) => {
        const rewardToken = callResult.extraData.assetId
        const conversionRate = callResult.data ? callResult.extraData.params.processResults(callResult.data, callResult.extraData.params) : BNify(0)
        conversionRates[rewardToken] = conversionRate
      })
      return conversionRates
    }, {})

    // console.log('rewardTokensConversionRates', rewardTokensConversionRates)

    const marketIdsCallsByChainId = Object.keys(withdrawQueueLengthsByChain).reduce((callsByChainId: Record<number, Record<AssetId, CallData[]>>, index: any): Record<number, Record<AssetId, CallData[]>> => {
      withdrawQueueLengthsByChain[index]?.forEach(result => {
        const queueLength = result.data
        const vault = result.extraData.vault
        for (let i = 0; i < queueLength; i++) {
          const callData = multiCall.getCallData(vault.poolContract, 'withdrawQueue', [i], { vault })
          if (callData) {
            if (!callsByChainId[vault.chainId]) {
              callsByChainId[vault.chainId] = {}
            }
            if (!callsByChainId[vault.chainId][vault.cdoConfig.address]) {
              callsByChainId[vault.chainId][vault.cdoConfig.address] = []
            }
            callsByChainId[vault.chainId][vault.cdoConfig.address].push(callData)
            // callsByChainId[chainId].push(callData)
          }
        }
      })
      return callsByChainId
    }, {})

    // console.log('marketIdsCallsByChainId', marketIdsCallsByChainId)
    const marketIdsByChain = await Promise.all(Object.keys(marketIdsCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(marketIdsCallsByChainId[+chainId]).flat(), true, +chainId, web3Chains[chainId])))
    // console.log('marketIdsByChain', marketIdsByChain)

    const rewardsEmissionsCallsByChainId = Object.keys(marketIdsByChain).reduce((callsByChainId: Record<number, Record<AssetId, CallData[]>>, index: any): Record<number, Record<AssetId, CallData[]>> => {
      marketIdsByChain[index]?.forEach(result => {
        const marketId = result.data
        const vault = result.extraData.vault
        const morphoRewardsEmissionsContract = state.contractsNetworks[vault.chainId].find((Contract: GenericContract) => Contract.name === 'MorphoRewardsEmissions')

        const vaultRewardTokens = rewardTokensByChainId[index]?.find((decodedResult: DecodedResult) => decodedResult.extraData.vault.cdoConfig.address === vault.cdoConfig.address)

        if (!callsByChainId[vault.chainId]) {
          callsByChainId[vault.chainId] = {}
        }
        if (!callsByChainId[vault.chainId][vault.cdoConfig.address]) {
          callsByChainId[vault.chainId][vault.cdoConfig.address] = []
        }

        vaultRewardTokens?.data.forEach((rewardToken: string) => {
          urdAddresses.forEach((urdAddress: string) => {
            morphoSenders.forEach((senderAddress: string) => {
              const callParams = [senderAddress, urdAddress, rewardToken, marketId]
              const callData = multiCall.getCallData(morphoRewardsEmissionsContract.contract, 'rewardsEmissions', callParams, { vault, cdoAddress: vault.cdoConfig.address, marketId, rewardToken, urdAddress })
              if (callData) {
                callsByChainId[vault.chainId][vault.cdoConfig.address].push(callData)
              }
            })
          })
        })

      })
      return callsByChainId
    }, {})

    const rewardsEmissionsByChain = await Promise.all(Object.keys(rewardsEmissionsCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(rewardsEmissionsCallsByChainId[+chainId]).flat(), true, +chainId, web3Chains[chainId])))
    // console.log('rewardsEmissionsByChain', rewardsEmissionsByChain)

    const morphoVaultsTotalSupplies = morphoVaultsTotalSupplyByChainId.flat()

    return Object.keys(rewardsEmissionsByChain).reduce((rewardsEmissions: Record<AssetId, Record<AssetId, RewardEmission>>, index: any) => {
      rewardsEmissionsByChain[index]?.forEach(result => {
        const vault = result.extraData.vault
        const rewardEmissionData = result.data
        const cdoAddress = result.extraData.cdoAddress
        const rewardTokenAddress = result.extraData.rewardToken
        const rewardTokensConversionRate = bnOrZero(rewardTokensConversionRates[rewardTokenAddress])

        const rewardToken = selectUnderlyingTokenByAddress(vault.chainId, rewardTokenAddress)

        const annualDistribution = fixTokenDecimals(rewardEmissionData.supplyRewardTokensPerYear, rewardToken?.decimals || 18)
        if (annualDistribution.gt(0)) {
          const annualDistributionUsd = annualDistribution.times(rewardTokensConversionRate)
          const morphoVaultTotalSupplyFound = morphoVaultsTotalSupplies.find(result => cmpAddrs(result?.extraData?.vault?.poolConfig?.address, vault?.poolConfig?.address))

          const vaultTotalSupply = morphoVaultTotalSupplyFound ? fixTokenDecimals(morphoVaultTotalSupplyFound.data, 18) : BNify(0)
          const rewardEmission: RewardEmission = {
            annualDistribution,
            annualDistributionUsd,
            assetId: rewardTokenAddress,
            totalSupply: vaultTotalSupply
          }

          if (!rewardsEmissions[cdoAddress]) {
            rewardsEmissions[cdoAddress] = {}
          }

          if (!rewardsEmissions[cdoAddress][rewardTokenAddress]) {
            rewardsEmissions[cdoAddress][rewardTokenAddress] = rewardEmission
          } else {
            rewardsEmissions[cdoAddress][rewardTokenAddress].annualDistribution = rewardsEmissions[cdoAddress][rewardTokenAddress].annualDistribution.plus(annualDistribution)
            rewardsEmissions[cdoAddress][rewardTokenAddress].annualDistributionUsd = rewardsEmissions[cdoAddress][rewardTokenAddress].annualDistributionUsd.plus(annualDistributionUsd)
          }
        }
      })

      return rewardsEmissions
    }, {})
  }, [web3, multiCall, web3Chains, state.contractsNetworks])

  const getVaultsOnchainData = useCallback(async (vaults: Vault[], enabledCalls: string[] = []): Promise<VaultsOnchainData | null> => {

    if (!multiCall || !web3Chains || !vaultFunctionsHelper || !genericContractsHelper) return null

    const checkEnabledCall = (call: string) => {
      return !enabledCalls.length || enabledCalls.includes(call)
    }

    const poolsDataRawCallsByChainId: Record<number, Record<string, CallData[]>> = {}

    const rawCallsByChainId = vaults.filter((vault: Vault) => checkAddress(vault.id)).reduce((rawCalls: Record<number, CallData[][]>, vault: Vault): Record<number, CallData[][]> => {
      const aggregatedRawCalls = [
        ("getEpochData" in vault) ? vault.getEpochData() : [],
        ("getPausedCalls" in vault) ? vault.getPausedCalls() : [],
        ("getPoolVaultOpen" in vault) ? vault.getPoolVaultOpen() : [],
        account && checkEnabledCall('balances') ? vault.getBalancesCalls([account.address]) : [],
        ("getPricesCalls" in vault) && checkEnabledCall('prices') ? vault.getPricesCalls() : [],
        ("getPricesUsdCalls" in vault) && checkEnabledCall('pricesUsd') ? vault.getPricesUsdCalls(state.contractsNetworks[+vault.chainId]) : [],
        ("getAprsCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprsCalls() : [],
        ("getTotalSupplyCalls" in vault) && checkEnabledCall('totalSupplies') ? vault.getTotalSupplyCalls() : [],
        ("getFeesCalls" in vault) && checkEnabledCall('fees') ? vault.getFeesCalls() : [],
        ("getLimitsCalls" in vault) && checkEnabledCall('limits') ? vault.getLimitsCalls() : [],
        ("getAprRatioCalls" in vault) && checkEnabledCall('aprs') ? vault.getAprRatioCalls() : [],
        ("getCurrentAARatioCalls" in vault) && checkEnabledCall('aprs') ? vault.getCurrentAARatioCalls() : [],
        ("getBaseAprCalls" in vault) && checkEnabledCall('aprs') ? vault.getBaseAprCalls() : [],
        ("getProtocolsCalls" in vault) && checkEnabledCall('protocols') ? vault.getProtocolsCalls() : [],
        ("getInterestBearingTokensCalls" in vault) && checkEnabledCall('protocols') ? vault.getInterestBearingTokensCalls() : [],
        ("getInterestBearingTokensExchangeRatesCalls" in vault) && checkEnabledCall('protocols') ? vault.getInterestBearingTokensExchangeRatesCalls() : [],
        account && checkEnabledCall('auth') && ("isWalletAllowed" in vault) ? vault.isWalletAllowed(account.address) : [],
      ]

      if (!rawCalls[vault.chainId]) {
        rawCalls[vault.chainId] = []
      }

      // Add poolData
      if ("getPoolDataCalls" in vault) {
        if (!poolsDataRawCallsByChainId[vault.chainId]) {
          poolsDataRawCallsByChainId[vault.chainId] = {}
        }
        if (!poolsDataRawCallsByChainId[vault.chainId][vault.cdoConfig.address]) {
          poolsDataRawCallsByChainId[vault.chainId][vault.cdoConfig.address] = []
          const poolDataCalls = vault.getPoolDataCalls()
          poolDataCalls.forEach((rawCall: ContractRawCall) => {
            const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
            if (callData) {
              poolsDataRawCallsByChainId[vault.chainId][vault.cdoConfig.address].push(callData)
            }
          })
        }
      }

      aggregatedRawCalls.forEach((calls: ContractRawCall[], index: number) => {
        // Init array index
        if (rawCalls[vault.chainId].length <= index) {
          rawCalls[vault.chainId].push([])
        }

        calls.forEach((rawCall: ContractRawCall) => {
          const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
          if (callData) {
            rawCalls[vault.chainId][index].push(callData)
          }
        })
      })

      return rawCalls
    }, {})

    const mainnetRawCalls = vaults.filter((vault: Vault) => checkAddress(vault.id)).reduce((mainnetRawCalls: CallData[][], vault: Vault): CallData[][] => {
      const aggregatedRawCalls = [
        ("getIdleDistributionCalls" in vault) && checkEnabledCall('aprs') ? vault.getIdleDistributionCalls() : [],
        ("getRewardTokensCalls" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensCalls() : [],
        account && ("getRewardTokensAmounts" in vault) && checkEnabledCall('rewards') ? vault.getRewardTokensAmounts(account.address) : [],
        ("getMultiRewardsDataCalls" in vault) && checkEnabledCall('rewards') ? vault.getMultiRewardsDataCalls() : [],
        ("getClaimableMultiRewardsCalls" in vault) && account && checkEnabledCall('balances') ? vault.getClaimableMultiRewardsCalls(account.address) : [],
        ("getClaimableRewardsCalls" in vault) && account && checkEnabledCall('balances') ? vault.getClaimableRewardsCalls(account.address) : [],
      ]

      aggregatedRawCalls.forEach((calls: ContractRawCall[], index: number) => {
        // Init array index
        if (mainnetRawCalls.length <= index) {
          mainnetRawCalls.push([])
        }

        calls.forEach((rawCall: ContractRawCall) => {
          const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
          if (callData) {
            mainnetRawCalls[index].push(callData)
          }
        })
      })

      return mainnetRawCalls
    }, [])

    // Add gauges calls
    const gaugesWeightsCalls = getGaugesCalls(vaults)
    if (gaugesWeightsCalls) {
      gaugesWeightsCalls.map((calls: CallData[]) => mainnetRawCalls.push(calls))
    }

    // Get vaults additional APRs
    const vaultsAdditionalAprsPromises = vaults.reduce((promises: Map<AssetId, Promise<VaultAdditionalApr>>, vault: Vault): Map<AssetId, Promise<VaultAdditionalApr>> => {
      const assetKey = vault.id
      if (promises.has(assetKey)) return promises
      promises.set(assetKey, vaultFunctionsHelper.getVaultAdditionalApr(vault))
      return promises
    }, new Map())

    // Get vaults additional base APRs
    const vaultsAdditionalBaseAprsPromises = vaults.reduce((promises: Map<AssetId, Promise<VaultAdditionalApr>>, vault: Vault): Map<AssetId, Promise<VaultAdditionalApr>> => {
      const assetKey = ("cdoConfig" in vault) ? vault.cdoConfig.address : vault.id
      if (promises.has(assetKey)) return promises
      promises.set(assetKey, vaultFunctionsHelper.getVaultAdditionalBaseApr(vault))
      return promises
    }, new Map())

    // Get vaults last harvests
    const vaultsLastHarvestsPromises = vaults.reduce((promises: Map<AssetId, Promise<CdoLastHarvest> | undefined>, vault: Vault): Map<AssetId, Promise<CdoLastHarvest> | undefined> => {
      if (!(vault instanceof TrancheVault) || promises.has(vault.cdoConfig.address)) return promises
      promises.set(vault.cdoConfig.address, vaultFunctionsHelper.getTrancheLastHarvest(vault))
      return promises
    }, new Map())

    // Get vaults epochs
    // const vaultsEpochsPromises = vaults.reduce((promises: Map<AssetId, Promise<EpochData | null> | undefined>, vault: Vault): Map<AssetId, Promise<EpochData | null> | undefined> => {
    //   if (!("cdoConfig" in vault) || promises.has(vault.cdoConfig.address)) return promises
    //   promises.set(vault.cdoConfig.address, vaultFunctionsHelper.getVaultEpochData(vault))
    //   return promises
    // }, new Map())

    // Get vaults total aprs
    const vaultsTotalAprsPromises = vaults.reduce((promises: Map<AssetId, Promise<VaultAdditionalApr | null>>, vault: Vault): Map<AssetId, Promise<VaultAdditionalApr | null>> => {
      if (!("cdoConfig" in vault) || promises.has(vault.cdoConfig.address)) return promises
      promises.set(vault.cdoConfig.address, vaultFunctionsHelper.getVaultTotalApr(vault))
      return promises
    }, new Map())

    // const stakedIdleVault = vaults.find( (vault: Vault) => vault.type === 'STK' ) as StakedIdleVault
    // const stakedIdleVaultRewardsPromise = vaultFunctionsHelper.getStakingRewards(stakedIdleVault)

    // Get Matic NFTs
    const maticNFTsPromise = checkEnabledCall('balances') && account?.address ? vaultFunctionsHelper.getMaticTrancheNFTs(account.address) : []

    const morphoRewardsEmissionsPromise = getMorphoRewardsEmissions(vaults)
    const gearboxPointsEmissionsPromise = getGearboxPointsEmissions(vaults)
    const ethenaCooldownsPromises = account?.address ? getEthenaCooldowns(vaults, account?.address) : []
    
    const creditVaultsEpochsPromises = vaults.reduce((promises: Map<AssetId, Promise<any | null>>, vault: Vault): Map<AssetId, Promise<any | null>> => {
      if (!(vault instanceof CreditVault)){
        return promises
      }
      promises.set(vault.cdoConfig.address, vaultFunctionsHelper.getCreditVaultEpochs(vault))
      return promises
    }, new Map())

    // console.log('vaultsAdditionalBaseAprsPromises', vaultsAdditionalBaseAprsPromises)

    // const stkIdleCalls = getStkIdleCalls()
    // rawCalls.push(stkIdleCalls)

    // console.log('stkIdleCalls', stkIdleCalls)
    // console.log('rawCalls', rawCalls)

    const [
      maticNFTs,
      ethenaCooldowns,
      morphoRewardsEmissions,
      gearboxPointsEmissions,
      // stakedIdleVaultRewards,
      creditVaultsEpochs,
      vaultsAdditionalAprs,
      vaultsAdditionalBaseAprs,
      vaultsLastHarvests,
      // vaultsEpochsData,
      vaultsTotalAprs,
      rawCallsResultsByChain,
      poolDataRawCallsResultsByChain,
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
      ethenaCooldownsPromises,
      morphoRewardsEmissionsPromise,
      gearboxPointsEmissionsPromise,
      // stakedIdleVaultRewardsPromise,
      Promise.all(Array.from(creditVaultsEpochsPromises.values())),
      Promise.all(Array.from(vaultsAdditionalAprsPromises.values())),
      Promise.all(Array.from(vaultsAdditionalBaseAprsPromises.values())),
      Promise.all(Array.from(vaultsLastHarvestsPromises.values())),
      // Promise.all(Array.from(vaultsEpochsPromises.values())),
      Promise.all(Array.from(vaultsTotalAprsPromises.values())),
      Promise.all(Object.keys(rawCallsByChainId).map(chainId => multiCall.executeMultipleBatches(rawCallsByChainId[+chainId], +chainId, web3Chains[chainId]))),
      Promise.all(Object.keys(poolsDataRawCallsByChainId).map(chainId => multiCall.executeMulticalls(Object.values(poolsDataRawCallsByChainId[+chainId]).flat(), true, +chainId, web3Chains[chainId]))),
      // multiCall.executeMultipleBatches(rawCalls),
      multiCall.executeMultipleBatches(mainnetRawCalls, STAKING_CHAINID, web3Chains[STAKING_CHAINID]),
    ])

    // console.log('creditVaultsEpochs', creditVaultsEpochs)
    // console.log('gearboxPointsEmissions', gearboxPointsEmissions)

    let fees: Balances = {}
    let aprs: Balances = {}
    let limits: Balances = {}
    let baseAprs: Balances = {}
    let balances: Balances = {}
    let totalAprs: Balances = {}
    let aprRatios: Balances = {}
    let pricesUsd: Balances = {}
    let vaultsPrices: Balances = {}
    let currentRatios: Balances = {}
    let totalSupplies: Balances = {}
    let additionalAprs: Balances = {}
    let vaultsRewards: VaultsRewards = {}
    let rewards: Record<AssetId, Balances> = {}
    let openVaults: Record<AssetId, boolean> = {}
    let allocations: Record<AssetId, Balances> = {}
    let pausedVaults: Record<AssetId, boolean> = {}
    let walletAllowed: Record<AssetId, boolean> = {}
    let protocolsAprs: Record<AssetId, Balances> = {}
    let aprsBreakdown: Record<AssetId, Balances> = {}
    let poolsData: VaultsOnchainData["poolsData"] = {}
    let epochsData: Record<AssetId, Asset["epochData"]> = {}
    let interestBearingTokens: Record<AssetId, Balances> = {}
    let lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]> = {}

    Object.keys(rawCallsByChainId).forEach((chainId, resultIndex) => {
      const [
        epochDataResults,
        pausedCallsResults,
        openVaultsCallsResults,
        balanceCallsResults,
        vaultsPricesCallsResults,
        pricesUsdCallsResults,
        aprsCallsResults,
        totalSupplyCallsResults,
        feesCallsResults,
        limitsCallsResults,
        aprRatioResults,
        currentRatioResults,
        baseAprResults,
        protocolsResults,
        interestBearingTokensCallsResults,
        interestBearingTokensExchangeRatesCallsResults,
        walletAllowedResults
      ]: DecodedResult[][] = rawCallsResultsByChain[resultIndex]

      // console.log('aprsCallsResults', aprsCallsResults)
      // console.log('epochDataResults', epochDataResults)
      // console.log('walletAllowedResults', account, walletAllowedResults)

      const poolsDataResults = poolDataRawCallsResultsByChain[resultIndex]

      // console.log('epochDataResults', epochDataResults)
      // console.log('idleDistributionResults', idleDistributionResults, idleDistribution)

      if (poolsDataResults) {
        poolsData = poolsDataResults.reduce((poolsData: VaultsOnchainData["poolsData"], callResult: DecodedResult) => {
          const cdoId = callResult.extraData.data.cdoAddress

          // Get vaults by cdo address
          const cdoVaults: Vault[] = vaults.filter((vault: Vault) => ("cdoConfig" in vault) && vault.cdoConfig.address === cdoId)
          cdoVaults.forEach((vault: Vault) => {
            const protocolField = callResult.extraData.data.protocolField
            if (!poolsData[vault.id]) {
              poolsData[vault.id] = {}
            }
            let data = fixTokenDecimals(callResult.data, callResult.extraData.data.decimals)
            if (typeof callResult.extraData.data.formatFn === 'function') {
              data = callResult.extraData.data.formatFn(data)
            }
            poolsData[vault.id][protocolField] = data
            // console.log(chainId, vault.id, protocolField, poolsData[vault.id][protocolField].toString())
          })
          return poolsData
        }, {})
      }

      // Process wallet allowed
      walletAllowed = walletAllowedResults.reduce((walletAllowed: Record<AssetId, boolean>, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        walletAllowed[assetId] = !!callResult.data
        return {
          ...walletAllowed,
          [assetId]: !!callResult.data
        }
      }, walletAllowed)

      // Process paused vaults
      pausedVaults = pausedCallsResults.reduce((pausedVaults: Record<AssetId, boolean>, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        // console.log('idleDistribution', assetId, fixTokenDecimals(callResult.data.toString(), 18).toString())
        pausedVaults[assetId] = !!callResult.data
        return {
          ...pausedVaults,
          [assetId]: !!callResult.data
        }
      }, pausedVaults)

      // Process opened vaults
      openVaults = openVaultsCallsResults.reduce((openVaults: Record<AssetId, boolean>, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        // console.log('idleDistribution', assetId, fixTokenDecimals(callResult.data.toString(), 18).toString())
        openVaults[assetId] = !!callResult.data
        return {
          ...openVaults,
          [assetId]: !!callResult.data
        }
      }, openVaults)

      // console.log('openVaults', openVaults)

      // Process protocols Aprs
      protocolsAprs = protocolsResults.reduce((protocolsAprs: Record<AssetId, Balances>, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          protocolsAprs[assetId] = {}
          callResult.data[0].forEach((protocolAddress: string, index: number) => {
            const protocolApr = fixTokenDecimals(callResult.data[1][index], 18)
            protocolsAprs[assetId][protocolAddress.toLowerCase()] = apr2apy(protocolApr.div(100)).times(100)
          })
        }
        return protocolsAprs
      }, protocolsAprs)

      // Prices Usd
      pricesUsd = pricesUsdCallsResults.reduce((pricesUsd: Balances, callResult: DecodedResult) => {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset) {
          pricesUsd[assetId] = callResult.data ? callResult.extraData.params.processResults(callResult.data, callResult.extraData.params) : BNify(1)
        }
        return pricesUsd
      }, pricesUsd)

      // console.log('pricesUsd', pricesUsd)

      // Process interest bearing tokens
      interestBearingTokens = interestBearingTokensCallsResults.reduce((interestBearingTokens: Record<AssetId, Balances>, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          if (!interestBearingTokens[assetId]) {
            interestBearingTokens[assetId] = {}
          }

          const protocolAddress = callResult.extraData.data.address.toLowerCase()
          interestBearingTokens[assetId][protocolAddress] = fixTokenDecimals(callResult.data, callResult.extraData.data.decimals)

          const interestBearingTokensExchangeRateResult = interestBearingTokensExchangeRatesCallsResults.find((callResult: DecodedResult) => {
            return cmpAddrs(callResult.extraData.data.address, protocolAddress)
          })

          if (interestBearingTokensExchangeRateResult) {
            const exchangeRate = fixTokenDecimals(interestBearingTokensExchangeRateResult.data, interestBearingTokensExchangeRateResult.extraData.data.decimals)
            interestBearingTokens[assetId][protocolAddress] = interestBearingTokens[assetId][protocolAddress].times(exchangeRate)
          }
        }
        return interestBearingTokens
      }, interestBearingTokens)

      allocations = Object.keys(interestBearingTokens).reduce((allocations: Record<AssetId, Balances>, assetId: AssetId) => {
        const assetTotalAllocation = Object.keys(interestBearingTokens[assetId]).reduce((total: BigNumber, protocolAddress: AssetId) => {
          const underlyingToken = selectUnderlyingTokenByAddress(+chainId, protocolAddress)
          if (underlyingToken) return total
          return total.plus(interestBearingTokens[assetId][protocolAddress])
        }, BNify(0))

        allocations[assetId] = Object.keys(interestBearingTokens[assetId]).reduce((assetAllocations: Balances, protocolAddress: AssetId) => {
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
      aprRatios = aprRatioResults.reduce((aprRatios: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
            const trancheAPRSplitRatio = BNify(callResult.data.toString()).div(`1e03`)
            const aprRatio = asset.type === 'AA' ? trancheAPRSplitRatio : BNify(100).minus(trancheAPRSplitRatio)
            aprRatios[assetId] = aprRatio
          }
        }
        return aprRatios
      }, aprRatios)

      // Process AA Ratio
      currentRatios = currentRatioResults.reduce((currentRatios: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
            const currentAARatio = BNify(callResult.data.toString()).div(`1e03`)
            const aprRatio = asset.type === 'AA' ? currentAARatio : BNify(100).minus(currentAARatio)
            currentRatios[assetId] = aprRatio
          }
        }
        return currentRatios
      }, currentRatios)

      // Process Rewards
      rewards = rewardTokensAmountsResults.reduce((rewards: Record<AssetId, Balances>, callResult: DecodedResult): Record<AssetId, Balances> => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
            const rewardTokens = rewardTokensResults.find(rewardTokensCall => rewardTokensCall.extraData.assetId?.toString() === assetId)
            if (!rewardTokens) return rewards

            const assetRewards = callResult.data.reduce((assetRewards: Balances, amount: string, rewardIndex: number): Balances => {
              const rewardId = rewardTokens.data[rewardIndex]
              const rewardAsset = selectAssetById(rewardId)
              if (!rewardAsset) return assetRewards
              const rewardAmount = fixTokenDecimals(amount, rewardAsset.decimals)

              // Init rewards and add reward amount
              if (rewardAmount.gt(0)) {
                if (!vaultsRewards[rewardId]) {
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
      baseAprs = baseAprResults.reduce((baseAprs: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
            const vault = selectVaultById(assetId)
            let baseApr = BNify(callResult.data.toString()).div(`1e18`)

            // Add additional Apr
            const vaultAdditionalBaseApr: VaultAdditionalApr | undefined = vaultsAdditionalBaseAprs.find((apr: VaultAdditionalApr) => (apr.vaultId === assetId || (vault && "cdoConfig" in vault && apr.cdoId === vault.cdoConfig?.address)))
            if (vaultAdditionalBaseApr) {
              baseApr = baseApr.plus(vaultAdditionalBaseApr.apr)
              // console.log(`Base Apr ${asset.name}: ${vaultAdditionalBaseApr.apr.toString()} = ${baseApr.toString()}`)

              if (vaultAdditionalBaseApr.type === 'base') {
                if (!aprs[assetId]) {
                  aprs[assetId] = BNify(0)
                }
                aprs[assetId] = aprs[assetId].plus(vaultAdditionalBaseApr.apr)
              }
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

      // console.log('baseAprs', baseAprs)
      // console.log('vaultsAdditionalAprs', vaultsAdditionalAprs)

      // Process last harvest blocks
      lastHarvests = (Object.values(vaultsLastHarvests) as CdoLastHarvest[]).reduce((lastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>, lastHarvest: CdoLastHarvest) => {
        const cdoId = lastHarvest.cdoId
        const filteredVaults = vaults.filter((vault: Vault) => ("cdoConfig" in vault) && vault.cdoConfig.address === cdoId)
        filteredVaults.forEach((vault: Vault) => {
          const assetId = vault.id
          lastHarvests[assetId] = lastHarvest.harvest || null
        })

        return lastHarvests
      }, lastHarvests)

      // Process vaults epochs
      // epochsData = vaultsEpochsData.reduce((epochsData: Record<AssetId, Asset["epochData"]>, epochData: Asset["epochData"]) => {
      //   if (epochData?.cdoId) {
      //     const filteredVaults = vaults.filter((vault: Vault) => ("cdoConfig" in vault) && cmpAddrs(vault.cdoConfig.address, epochData.cdoId as string))
      //     filteredVaults.forEach((vault: Vault) => {
      //       const assetId = vault.id
      //       epochsData[assetId] = epochData
      //     })
      //   }
      //   return epochsData
      // }, epochsData)

      // console.log('epochDataResults', epochDataResults)

      // console.log('aprsCallsResults', aprsCallsResults)

      // Process total aprs
      totalAprs = vaultsTotalAprs.reduce((totalAprs: Balances, vaultTotalApr: VaultAdditionalApr | null) => {
        if (vaultTotalApr?.cdoId) {
          const filteredVaults = vaults.filter((vault: Vault) => ("cdoConfig" in vault) && cmpAddrs(vault.cdoConfig.address, vaultTotalApr.cdoId as string))
          filteredVaults.forEach((vault: Vault) => {
            const assetId = vault.id
            totalAprs[assetId] = vaultTotalApr.apr
          })
        }
        return totalAprs
      }, totalAprs)

      // Process Fees
      fees = feesCallsResults.reduce((fees: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
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
      limits = limitsCallsResults.reduce((limits: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
            const decimals = callResult.extraData.decimals || asset.decimals
            const limit = BNify(callResult.data.toString()).div(`1e${decimals}`)
            limits[assetId] = limit
          }
        }
        return limits
      }, {})

      balances = balanceCallsResults.reduce((balances: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
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

      vaultsPrices = vaultsPricesCallsResults.reduce((vaultsPrices: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
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

      totalSupplies = totalSupplyCallsResults.reduce((totalSupplies: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset) {
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


      if (!isEmpty(epochDataResults)){
        // @ts-ignore
        const vaultsEpochsData = epochDataResults.reduce( (vaultsEpochsData: Record<AssetId, CreditVaultEpoch>, callResult: DecodedResult) => {
          // @ts-ignore
          const assetId = callResult.extraData.assetId
          if (!assetId) return vaultsEpochsData
          const methodName = callResult.callData.method.replace('()', '')
          const fieldName = callResult.extraData?.data?.field || methodName
          const fieldData = callResult.data

          return {
            ...vaultsEpochsData,
            [assetId]: {
              ...vaultsEpochsData[assetId],
              [fieldName]: fieldData
            }
          }
        }, {})

        Object.keys(vaultsEpochsData).forEach( (assetId: AssetId) => {
          const vaultEpochData = vaultsEpochsData[assetId]
          // Set epoch start date
          if (vaultEpochData.defaulted){
            vaultEpochData.status = 'default'  
          } else {
            vaultEpochData.status = vaultEpochData.isEpochRunning ? 'running' : 'open'
          }
          vaultEpochData.epochStartDate = bnOrZero(vaultEpochData.epochEndDate).gt(0) ? BNify(vaultEpochData.epochEndDate).minus(vaultEpochData.epochDuration).times(1000).toNumber() : 0
          vaultEpochData.epochEndDate = BNify(vaultEpochData.epochEndDate).times(1000).toNumber()
          vaultEpochData.epochNumber = bnOrZero(vaultEpochData.epochNumber).toNumber()

          // Process epochs interests
          const vaultEpochs = creditVaultsEpochs?.find( (epoch: {
            assetId: string;
            cdoId?: string;
            epochs: VaultContractCdoEpochData[];
          }) => cmpAddrs(epoch.assetId, assetId) )

          if (vaultEpochs){

            const assetFees = bnOrZero(fees[assetId])

            vaultEpochData.epochs = vaultEpochs.epochs.map( (epoch: VaultContractCdoEpochData) => {
              const grossAPR = BNify(epoch.APRs.GROSS);
              const netAPY = compoundVaultApr(
                grossAPR.minus(grossAPR.times(assetFees)),
                vaultEpochData.epochDuration
              ).toNumber();

              const APYs = {
                NET: netAPY
              }
              return {
                ...epoch,
                APYs
              }
            })

            // Set epochApr if undefined
            if (BNify(vaultEpochData.epochApr).isNaN()){
              const lastEpoch = sortArrayByKey(vaultEpochData.epochs, "count", "desc")[0]
              if (lastEpoch){
                vaultEpochData.epochApr = BNify(normalizeTokenAmount(lastEpoch.APRs.GROSS, 18));
              }
            }
          }
          epochsData[assetId] = vaultEpochData
        })
      }

      aprs = aprsCallsResults.reduce((aprs: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          const vault = selectVaultById(assetId)
          if (asset && vault) {
            const decimals = callResult.extraData.decimals || 18
            if (!aprs[assetId]) {
              aprs[assetId] = BNify(0)
            }

            // Check APR for Credit Vault
            const epochData = epochsData[assetId]
            if (vault instanceof CreditVault && epochData && ("epochs" in epochData) && epochData.epochs?.length){
              // Take the average of the last 3 epochs for STRATEGY vaults
              if (vault.vaultConfig.mode === 'STRATEGY'){
                // const lastEpochs = epochData.epochs.filter( (epochData: VaultContractCdoEpochData) => epochData.status === 'FINISHED' ).slice(-3)
                // aprs[assetId] = lastEpochs.reduce( (acc: BigNumber, epochData: VaultContractCdoEpochData) => {
                //   return acc.plus(bnOrZero(epochData.APRs.GROSS).div(lastEpochs.length))
                // }, BNify(0))
                const lastFinishedEpoch = epochData.epochs.find( (epochData: VaultContractCdoEpochData) => epochData.status === 'FINISHED' )
                aprs[assetId] = bnOrZero(lastFinishedEpoch?.APRs.GROSS)
              // Take latest GROSS apr for CREDIT vaults
              } else {
                const latestEpoch = epochData.epochs[0]
                aprs[assetId] = bnOrZero(latestEpoch.APRs.GROSS)
              }
            } else {
              aprs[assetId] = aprs[assetId].plus(BNify(callResult.data.toString()).div(`1e${decimals}`))
            }

            aprsBreakdown[assetId] = {
              base: aprs[assetId]
            }

            // Add additional Apr
            const vaultAdditionalApr: VaultAdditionalApr | undefined = vaultsAdditionalAprs.find((apr: VaultAdditionalApr) => (apr.vaultId === assetId))
            if (vaultAdditionalApr && vaultAdditionalApr.apr.gt(0)) {
              const additionalApr = vaultAdditionalApr.apr.div(`1e${decimals}`)
              // console.log(`Additional Apr ${asset.id}: ${vaultAdditionalApr.apr.toString()}, decimals ${decimals} => ${additionalApr.toString()}`)
              // console.log(`Additional Apr ${asset.name}: ${aprs[assetId].toString()} + ${additionalApr.toString()} = ${aprs[assetId].plus(additionalApr).toString()}`)
              aprs[assetId] = aprs[assetId].plus(additionalApr)

              // Add to base APR if no type
              if (!vaultAdditionalApr.type) {
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

              const harvestDays = dayDiff((lastHarvests[assetId]?.timestamp!) * 1000, Date.now())

              // Reset harvest APY if base APY is zero
              if (aprsBreakdown[assetId].base.lte(0) && harvestDays > 1) {
                aprsBreakdown[assetId].harvest = BNify(0)
              }
            }
          }
        }
        return aprs
      }, aprs)

    })

    // Process idle distribution
    const idleDistributions = idleDistributionResults.reduce((idleDistributions: Balances, callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        // console.log('idleDistribution', assetId, fixTokenDecimals(callResult.data.toString(), 18).toString())
        idleDistributions[assetId] = fixTokenDecimals(callResult.data.toString(), 18)
      }
      return idleDistributions
    }, {})

    // Process Gauges data
    const gaugesRelativeWeights: Record<string, DecodedResult[]> | null = gaugesTimeWeights ? await genericContractsHelper.getGaugesRelativeWeights(gaugesTimeWeights) : {}

    const gaugesData = gaugesRelativeWeights?.weights ? gaugesRelativeWeights.weights.reduce((gaugesData: GaugesData, callResult: DecodedResult) => {
      const gaugeId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
      const gaugeVault = selectVaultById(gaugeId)
      if (!gaugeVault || !("getGaugeRewardData" in gaugeVault)) return gaugesData

      const weight = fixTokenDecimals(callResult.data, 18)
      const nextWeightResult = gaugesRelativeWeights.nextWeights.find((callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId)
      const nextWeight = nextWeightResult ? fixTokenDecimals(nextWeightResult.data, 18) : weight
      const totalSupply = totalSupplies[gaugeId] || selectAssetTotalSupply(gaugeId)
      const distributionRate = fixTokenDecimals(gaugesDistributionRate[0].data, 18).times(86400).times(weight)

      const tranchePrice = vaultsPrices[gaugeVault.trancheToken.address] || selectVaultPrice(gaugeVault.trancheToken.address)
      const tranchePriceUsd = pricesUsd[gaugeVault.trancheToken.address] || selectAssetPriceUsd(gaugeVault.trancheToken.address)

      const gaugePoolUsd = totalSupply.times(tranchePrice).times(tranchePriceUsd)

      const claimableRewards = gaugeClaimableRewards.find((callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId)
      const multiRewardsData = gaugeMultiRewardsData.filter((callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId)
      const claimableMultiRewards = gaugeClaimableMultiRewards.filter((callResult: DecodedResult) => callResult.extraData.assetId?.toString() === gaugeId)

      const rewards: GaugeRewards = {}

      if (claimableRewards && gaugeVault.rewardToken?.address) {
        const rewardData = gaugeVault.getGaugeRewardData(gaugeVault.rewardToken.address, BNify(claimableRewards.data))
        if (rewardData) {
          rewards[gaugeVault.rewardToken.address] = {
            ...rewardData,
            rate: distributionRate
          }
        }
      }

      if (multiRewardsData) {
        for (const callResult of multiRewardsData) {
          const rewardDistributionData = callResult.data
          if (rewardDistributionData) {
            const rewardTokenAddress = callResult.callData.args[0][0].toLowerCase()
            const rewardClaimableBalance = claimableMultiRewards?.find((claimableMultiReward: DecodedResult) => claimableMultiReward.callData.args[1][0].toLowerCase() === rewardTokenAddress)
            const rewardData = gaugeVault.getGaugeRewardData(rewardTokenAddress, BNify(rewardClaimableBalance?.data), rewardDistributionData.rewardRate)
            // console.log('multireward token', rewardTokenAddress, claimableMultiRewards, rewardClaimableBalance, rewardData)
            if (rewardData) {
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
      totalAprs,
      poolsData,
      epochsData,
      // assetsData,
      gaugesData,
      openVaults,
      // stakingData,
      allocations,
      lastHarvests,
      vaultsPrices,
      pausedVaults,
      totalSupplies,
      aprsBreakdown,
      protocolsAprs,
      walletAllowed,
      vaultsRewards,
      currentRatios,
      additionalAprs,
      ethenaCooldowns,
      idleDistributions,
      interestBearingTokens,
      morphoRewardsEmissions,
      gearboxPointsEmissions
    }
  }, [selectAssetById, web3Chains, account, multiCall, selectVaultById, getEthenaCooldowns, getGearboxPointsEmissions, getMorphoRewardsEmissions, state.contractsNetworks, genericContractsHelper, vaultFunctionsHelper, getGaugesCalls, selectAssetPriceUsd, selectAssetTotalSupply, selectVaultPrice])

  useEffect(() => {
    if (!protocolToken) return
    dispatch({ type: 'SET_PROTOCOL_TOKEN', payload: protocolToken })
  }, [protocolToken])

  // Clear running effects on network changed
  useEffect(() => {
    if (!networkChanged) return
    runningEffects.current = {}
    dispatch({ type: 'RESET_STATE', payload: {} })
    // console.log('NETWORK CHANGED - RESET STATE');
  }, [networkChanged])

  // Clear portfolio when wallet disconnect
  useEffect(() => {
    if (!!prevAccount && !account) {
      dispatch({ type: 'RESET_STATE', payload: {} })
      // console.log('ACCOUNT CHANGED - RESET STATE')
    }
  }, [accountChanged, account, prevAccount])

  // Update on-chain data of last transaction asset
  useEffect(() => {
    if (!lastTransaction || !state.isPortfolioLoaded) return
    if (!lastTransaction?.lastUpdated || lastTransaction.lastUpdated < state.portfolioTimestamp) return

    const asset = selectAssetById(lastTransaction.vaultId as string)
    const vault = selectVaultById(lastTransaction.vaultId as string)

    if (!asset || asset.type === 'underlying' || !vault) return

    const vaults = [vault as Vault]

    if (("underlyingId" in asset) && asset.underlyingId) {
      const underlyingVault = selectVaultById(asset.underlyingId)
      vaults.push(underlyingVault as Vault)
    }

    const gaugeVault = selectVaultGauge(vault.id)
    if (gaugeVault) {
      vaults.push(gaugeVault as Vault)

      if ("rewardTokens" in gaugeVault) {
        for (const rewardToken of gaugeVault.rewardTokens) {
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

      const vaultsRequests = await loadVaultsRequests();
      dispatch({ type: 'SET_VAULTS_REQUESTS', payload: vaultsRequests })

      const vaultsOnChainData = await getVaultsOnchainData(vaults);
      if (!vaultsOnChainData) return

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
        totalAprs,
        poolsData,
        gaugesData,
        openVaults,
        epochsData,
        allocations,
        // stakingData,
        lastHarvests,
        pausedVaults,
        vaultsPrices,
        walletAllowed,
        totalSupplies,
        protocolsAprs,
        aprsBreakdown,
        currentRatios,
        // vaultsRewards,
        additionalAprs,
        ethenaCooldowns,
        idleDistributions,
        interestBearingTokens,
        morphoRewardsEmissions,
        gearboxPointsEmissions
      } = vaultsOnChainData

      const newAprs = vaults.map((vault: Vault) => vault.id).reduce((newAprs: Balances, vaultId: AssetId) => {
        if (!aprs[vaultId]) {
          newAprs[vaultId] = BNify(0)
          return newAprs
        }
        return {
          ...newAprs,
          [vaultId]: aprs[vaultId]
        }
      }, { ...state.aprs })

      const newPausedVaults = vaults.map((vault: Vault) => vault.id).reduce((newPausedVaults: Record<AssetId, boolean>, vaultId: AssetId) => {
        if (!pausedVaults[vaultId]) {
          newPausedVaults[vaultId] = false
          return newPausedVaults
        }
        return {
          ...newPausedVaults,
          [vaultId]: pausedVaults[vaultId]
        }
      }, { ...state.pausedVaults })

      const newWalletAllowed = vaults.map((vault: Vault) => vault.id).reduce((newWalletAllowed: Record<AssetId, boolean>, vaultId: AssetId) => {
        if (!walletAllowed[vaultId]) {
          newWalletAllowed[vaultId] = false
          return newWalletAllowed
        }
        return {
          ...newWalletAllowed,
          [vaultId]: walletAllowed[vaultId]
        }
      }, { ...state.walletAllowed })

      const newOpenVaults = vaults.map((vault: Vault) => vault.id).reduce((newOpenVaults: Record<AssetId, boolean>, vaultId: AssetId) => {
        if (!openVaults[vaultId]) {
          newOpenVaults[vaultId] = true
          return newOpenVaults
        }
        return {
          ...newOpenVaults,
          [vaultId]: openVaults[vaultId]
        }
      }, { ...state.openVaults })

      const newIdleDistributions = vaults.map((vault: Vault) => vault.id).reduce((newIdleDistributions: Balances, vaultId: AssetId) => {
        if (!idleDistributions[vaultId]) {
          newIdleDistributions[vaultId] = BNify(0)
          return newIdleDistributions
        }
        return {
          ...newIdleDistributions,
          [vaultId]: idleDistributions[vaultId]
        }
      }, { ...state.idleDistributions })

      const newProtocolsAprs = vaults.map((vault: Vault) => vault.id).reduce((newProtocolsAprs: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!protocolsAprs[vaultId]) {
          delete newProtocolsAprs[vaultId]
          return newProtocolsAprs
        }
        return {
          ...newProtocolsAprs,
          [vaultId]: protocolsAprs[vaultId]
        }
      }, { ...state.protocolsAprs })

      const newPoolsData = vaults.map((vault: Vault) => vault.id).reduce((newPoolsData: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!poolsData[vaultId]) {
          delete newPoolsData[vaultId]
          return newPoolsData
        }
        return {
          ...newPoolsData,
          [vaultId]: poolsData[vaultId]
        }
      }, { ...state.poolsData })

      const newTotalAprs = vaults.map((vault: Vault) => vault.id).reduce((newTotalAprs: VaultsOnchainData["totalAprs"], vaultId: AssetId) => {
        if (!totalAprs[vaultId]) {
          delete newTotalAprs[vaultId]
          return newTotalAprs
        }
        return {
          ...newTotalAprs,
          [vaultId]: totalAprs[vaultId]
        }
      }, { ...state.totalAprs })

      const newEpochsData = vaults.map((vault: Vault) => vault.id).reduce((newEpochsData: VaultsOnchainData["epochsData"], vaultId: AssetId) => {
        if (!epochsData[vaultId]) {
          delete newEpochsData[vaultId]
          return newEpochsData
        }
        return {
          ...newEpochsData,
          [vaultId]: epochsData[vaultId]
        }
      }, { ...state.epochsData })

      const newFees = vaults.map((vault: Vault) => vault.id).reduce((newFees: Balances, vaultId: AssetId) => {
        if (!fees[vaultId]) {
          newFees[vaultId] = BNify(0)
          return newFees
        }
        return {
          ...newFees,
          [vaultId]: fees[vaultId]
        }
      }, { ...state.fees })

      const newLimits = vaults.map((vault: Vault) => vault.id).reduce((newLimits: Balances, vaultId: AssetId) => {
        if (!limits[vaultId]) {
          newLimits[vaultId] = BNify(0)
          return newLimits
        }
        return {
          ...newLimits,
          [vaultId]: limits[vaultId]
        }
      }, { ...state.limits })

      const newRewards = vaults.map((vault: Vault) => vault.id).reduce((newRewards: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!rewards[vaultId]) {
          delete newRewards[vaultId]
          return newRewards
        }
        return {
          ...newRewards,
          [vaultId]: rewards[vaultId]
        }
      }, { ...state.rewards })

      // Generate newVaultsRewards from new rewards
      const newVaultsRewards = (Object.keys(newRewards) as AssetId[]).reduce((vaultsRewards: VaultsRewards, vaultId: AssetId) => {
        const vaultRewards = newRewards[vaultId]
        for (const rewardId in vaultRewards) {
          const rewardAmount = BNify(vaultRewards[rewardId])

          // Init rewards and add reward amount
          if (rewardAmount.gt(0)) {
            if (!vaultsRewards[rewardId]) {
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

      const newBaseAprs = vaults.map((vault: Vault) => vault.id).reduce((newBaseAprs: Balances, vaultId: AssetId) => {
        if (!baseAprs[vaultId]) {
          newBaseAprs[vaultId] = BNify(0)
          return newBaseAprs
        }
        return {
          ...newBaseAprs,
          [vaultId]: baseAprs[vaultId]
        }
      }, { ...state.baseAprs })

      const newBalances = vaults.map((vault: Vault) => vault.id).reduce((newBalances: Balances, vaultId: AssetId) => {
        if (!balances[vaultId]) {
          newBalances[vaultId] = BNify(0)
          return newBalances
        }
        return {
          ...newBalances,
          [vaultId]: balances[vaultId]
        }
      }, { ...state.balances })

      const newPricesUsd = vaults.map((vault: Vault) => vault.id).reduce((newPricesUsd: Balances, vaultId: AssetId) => {
        if (!pricesUsd[vaultId]) {
          newPricesUsd[vaultId] = BNify(1)
          return newPricesUsd
        }
        return {
          ...newPricesUsd,
          [vaultId]: pricesUsd[vaultId]
        }
      }, { ...state.pricesUsd })

      const newAprRatios = vaults.map((vault: Vault) => vault.id).reduce((newAprRatios: Balances, vaultId: AssetId) => {
        if (!aprRatios[vaultId]) {
          newAprRatios[vaultId] = BNify(0)
          return newAprRatios
        }
        return {
          ...newAprRatios,
          [vaultId]: aprRatios[vaultId]
        }
      }, { ...state.aprRatios })

      const newCurrentRatios = vaults.map((vault: Vault) => vault.id).reduce((newCurrentRatios: Balances, vaultId: AssetId) => {
        if (!currentRatios[vaultId]) {
          newCurrentRatios[vaultId] = BNify(0)
          return newCurrentRatios
        }
        return {
          ...newCurrentRatios,
          [vaultId]: currentRatios[vaultId]
        }
      }, { ...state.currentRatios })

      const newAllocations = vaults.map((vault: Vault) => vault.id).reduce((newAllocations: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!allocations[vaultId]) {
          delete newAllocations[vaultId]
          return newAllocations
        }
        return {
          ...newAllocations,
          [vaultId]: allocations[vaultId]
        }
      }, { ...state.allocations })

      const newInterestBearingTokens = vaults.map((vault: Vault) => vault.id).reduce((newInterestBearingTokens: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!interestBearingTokens[vaultId]) {
          delete newInterestBearingTokens[vaultId]
          return newInterestBearingTokens
        }
        return {
          ...newInterestBearingTokens,
          [vaultId]: interestBearingTokens[vaultId]
        }
      }, { ...state.interestBearingTokens })

      const newLastHarvests = vaults.map((vault: Vault) => vault.id).reduce((newLastHarvests: Record<AssetId, CdoLastHarvest["harvest"]>, vaultId: AssetId) => {
        if (!lastHarvests[vaultId]) {
          delete newLastHarvests[vaultId]
          return newLastHarvests
        }
        return {
          ...newLastHarvests,
          [vaultId]: lastHarvests[vaultId]
        }
      }, { ...state.lastHarvests })

      const newVaultsPrices = vaults.map((vault: Vault) => vault.id).reduce((newVaultsPrices: Balances, vaultId: AssetId) => {
        if (!vaultsPrices[vaultId]) {
          newVaultsPrices[vaultId] = BNify(1)
          return newVaultsPrices
        }
        return {
          ...newVaultsPrices,
          [vaultId]: vaultsPrices[vaultId]
        }
      }, { ...state.vaultsPrices })

      const newTotalSupplies = vaults.map((vault: Vault) => vault.id).reduce((newTotalSupplies: Balances, vaultId: AssetId) => {
        if (!totalSupplies[vaultId]) {
          newTotalSupplies[vaultId] = BNify(0)
          return newTotalSupplies
        }
        return {
          ...newTotalSupplies,
          [vaultId]: totalSupplies[vaultId]
        }
      }, { ...state.totalSupplies })

      const newAprsBreakdown = vaults.map((vault: Vault) => vault.id).reduce((newAprsBreakdown: Record<AssetId, Balances>, vaultId: AssetId) => {
        if (!aprsBreakdown[vaultId]) {
          delete newAprsBreakdown[vaultId]
          return newAprsBreakdown
        }
        return {
          ...newAprsBreakdown,
          [vaultId]: aprsBreakdown[vaultId]
        }
      }, { ...state.aprsBreakdown })

      const newAdditionalAprs = vaults.map((vault: Vault) => vault.id).reduce((newAdditionalAprs: Balances, vaultId: AssetId) => {
        if (!additionalAprs[vaultId]) {
          newAdditionalAprs[vaultId] = BNify(0)
          return newAdditionalAprs
        }
        return {
          ...newAdditionalAprs,
          [vaultId]: additionalAprs[vaultId]
        }
      }, { ...state.additionalAprs })

      const newState: any = {
        maticNFTs,
        gaugesData,
        // stakingData,
        fees: newFees,
        aprs: newAprs,
        ethenaCooldowns,
        limits: newLimits,
        rewards: newRewards,
        balances: newBalances,
        baseAprs: newBaseAprs,
        morphoRewardsEmissions,
        gearboxPointsEmissions,
        aprRatios: newAprRatios,
        totalAprs: newTotalAprs,
        pricesUsd: newPricesUsd,
        poolsData: newPoolsData,
        epochsData: newEpochsData,
        openVaults: newOpenVaults,
        allocations: newAllocations,
        pausedVaults: newPausedVaults,
        lastHarvests: newLastHarvests,
        vaultsPrices: newVaultsPrices,
        walletAllowed: newWalletAllowed,
        currentRatios: newCurrentRatios,
        protocolsAprs: newProtocolsAprs,
        vaultsRewards: newVaultsRewards,
        aprsBreakdown: newAprsBreakdown,
        totalSupplies: newTotalSupplies,
        additionalAprs: newAdditionalAprs,
        idleDistributions: newIdleDistributions,
        interestBearingTokens: newInterestBearingTokens
      }

      // Reset vault positions effect
      runningEffects.current.vaultsPositions = false

      dispatch({ type: 'SET_STATE', payload: newState })
      dispatch({ type: 'SET_PORTFOLIO_TIMESTAMP', payload: Date.now() })
    })()

    // eslint-disable-next-line
  }, [lastTransaction, state.isPortfolioLoaded])

  // Init underlying tokens and vaults contracts
  useEffect(() => {
    if (!web3 || !web3Chains || !chainId || !cacheProvider?.isLoaded) return

    const contractsNetworks = Object.keys(web3Chains).reduce((contractsNetworks: Record<string, GenericContract[]>, chainId: any) => {
      if (!globalContracts[chainId]) return contractsNetworks
      contractsNetworks[chainId] = globalContracts[chainId].map((contract: GenericContractConfig) => {
        return new GenericContract(web3Chains[chainId], chainId, contract)
      })
      return contractsNetworks
    }, {})

    // Init all vaults networks
    const allVaultsNetworks: Record<string, Vault[]> = {}

    // Init underlying tokens vaults
    const underlyingTokensVaults: UnderlyingToken[] = []
    Object.keys(web3Chains).forEach((vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]) {
        allVaultsNetworks[vaultChainId] = []
      }

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]

      Object.keys(underlyingTokens[vaultChainId]).forEach(token => {
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
    Object.keys(web3Chains).forEach((vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]) {
        allVaultsNetworks[vaultChainId] = []
      }

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]
      const web3RpcToUse = +vaultChainId === +chainId ? web3Rpc : web3Chains[vaultChainId]

      Object.keys(tranches[vaultChainId]).forEach(protocol => {
        Object.keys(tranches[vaultChainId][protocol]).forEach(token => {
          const vaultConfig = tranches[vaultChainId][protocol][token]
          if (checkVaultEnv(vaultConfig, environment)) {
            const gaugeConfig = Object.values(gauges).find(gaugeConfig => gaugeConfig.trancheToken.address.toLowerCase() === vaultConfig.Tranches.AA.address.toLowerCase())
            const trancheVaultAA = new TrancheVault({ web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, protocol, vaultConfig, gaugeConfig, type: 'AA', cacheProvider })
            const trancheVaultBB = new TrancheVault({ web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, protocol, vaultConfig, gaugeConfig: null, type: 'BB', cacheProvider })
            allVaultsNetworks[vaultChainId].push(trancheVaultAA)
            allVaultsNetworks[vaultChainId].push(trancheVaultBB)
            trancheVaults.push(trancheVaultAA)
            trancheVaults.push(trancheVaultBB)
          }
        })
      })
    })

    // Init tranches vaults
    const creditVaults: CreditVault[] = []
    Object.keys(web3Chains).forEach((vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]) {
        allVaultsNetworks[vaultChainId] = []
      }

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]
      const web3RpcToUse = +vaultChainId === +chainId ? web3Rpc : web3Chains[vaultChainId]

      credits[vaultChainId]?.forEach( (vaultConfig: CreditVaultConfig) => {
        if (checkVaultEnv(vaultConfig, environment) && checkVaultAuthCode(vaultConfig, authCode)) {
          const creditVault = new CreditVault({ web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, vaultConfig, type: 'CR', cacheProvider })
          allVaultsNetworks[vaultChainId].push(creditVault)
          creditVaults.push(creditVault)
        }
      })
    })

    // Init global contracts
    const contracts = globalContracts[STAKING_CHAINID].map((contract: GenericContractConfig) => {
      return new GenericContract(web3, chainId, contract)
    })

    // const trancheVaults: TrancheVault[] = trancheVaultsNetworks[chainId]

    const idleController = contracts.find(c => c.name === 'IdleController')

    // Init best yield vaults
    const bestYieldVaults: BestYieldVault[] = []
    Object.keys(web3Chains).forEach((vaultChainId: any) => {
      if (!allVaultsNetworks[vaultChainId]) {
        allVaultsNetworks[vaultChainId] = []
      }

      if (!bestYield[vaultChainId]) return

      const web3ToUse = +vaultChainId === +chainId ? web3 : web3Chains[vaultChainId]
      const web3RpcToUse = +vaultChainId === +chainId ? web3Rpc : web3Chains[vaultChainId]

      Object.keys(bestYield[vaultChainId]).forEach(token => {
        const tokenConfig = bestYield[vaultChainId][token]
        if (checkVaultEnv(tokenConfig, environment)) {
          const bestYieldVault = new BestYieldVault({ web3: web3ToUse, web3Rpc: web3RpcToUse, chainId: vaultChainId, tokenConfig, type: 'BY', cacheProvider, idleController })
          allVaultsNetworks[vaultChainId].push(bestYieldVault)
          bestYieldVaults.push(bestYieldVault)
        }
      })
    })

    // const bestYieldVaults: BestYieldVault[] = bestYieldVaultsNetworks[chainId]

    const gaugeDistributorProxy = contracts.find(c => c.name === 'GaugeDistributorProxy')

    if (!allVaultsNetworks[STAKING_CHAINID]) {
      allVaultsNetworks[STAKING_CHAINID] = []
    }

    // Init gauges vaults
    const gaugesVaults: GaugeVault[] = Object.keys(gauges).reduce((vaultsContracts: GaugeVault[], token) => {
      const gaugeConfig = gauges[token]
      const trancheVault = trancheVaults.find(tranche => tranche.trancheConfig.address.toLowerCase() === gaugeConfig.trancheToken.address.toLowerCase())
      if (!trancheVault) return vaultsContracts
      const web3ToUse = +STAKING_CHAINID === +chainId ? web3 : web3Chains[STAKING_CHAINID]
      const gaugeVault = new GaugeVault({ web3: web3ToUse, chainId: STAKING_CHAINID, gaugeConfig, trancheVault, cacheProvider, gaugeDistributorProxy })
      vaultsContracts.push(gaugeVault)
      allVaultsNetworks[STAKING_CHAINID].push(gaugeVault)
      return vaultsContracts
    }, [])

    // Init stkIDLE vault
    const rewardTokenConfig = selectUnderlyingToken(STAKING_CHAINID, PROTOCOL_TOKEN) as UnderlyingTokenProps
    const stkIdleConfig = globalContracts[STAKING_CHAINID].find((contract: GenericContractConfig) => contract.name === 'stkIDLE') as GenericContractConfig
    const feeDistributorConfig = globalContracts[STAKING_CHAINID].find((contract: GenericContractConfig) => contract.name === 'StakingFeeDistributor') as GenericContractConfig

    // console.log('allVaultsNetworks', allVaultsNetworks)

    const allVaults: Vault[] = [...underlyingTokensVaults, ...trancheVaults, ...bestYieldVaults, ...gaugesVaults, ...creditVaults]

    if (stkIdleConfig) {

      const defaultChainWeb3 = +chainId === +STAKING_CHAINID ? web3 : web3Chains[STAKING_CHAINID]

      const stakedIdleVault: StakedIdleVault = new StakedIdleVault({ web3: defaultChainWeb3, chainId: STAKING_CHAINID, rewardTokenConfig, stkIdleConfig, feeDistributorConfig })

      // console.log('stakedIdleVault', stakedIdleVault)

      allVaults.push(stakedIdleVault)
      allVaultsNetworks[STAKING_CHAINID].push(stakedIdleVault)

      // Add staking reward token
      if (+STAKING_CHAINID !== +chainId) {
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

    dispatch({ type: 'SET_VAULTS', payload: allVaults })
    dispatch({ type: 'SET_CONTRACTS', payload: contracts })
    dispatch({ type: 'SET_VAULTS_CHAIN', payload: chainId })
    dispatch({ type: 'SET_ASSETS_DATA_IF_EMPTY', payload: assetsData })
    dispatch({ type: 'SET_VAULTS_NETWORKS', payload: allVaultsNetworks })
    dispatch({ type: 'SET_CONTRACTS_NETWORKS', payload: contractsNetworks })

    // Cleanup
    return () => {
      // dispatch({type: 'SET_VAULTS', payload: []})
      // dispatch({type: 'SET_CONTRACTS', payload: []})
      // const assetsData = generateAssetsData(allVaults)
      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
    };

    // eslint-disable-next-line
  }, [web3, web3Rpc, web3Chains, chainId, environment, authCode, cacheProvider?.isLoaded])

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
      selectVaultEpochData,
      selectAssetStrategies,
      selectAssetBalanceUsd,
      selectNetworkByVaultId,
      selectVaultNetworkById,
      selectVaultByCdoAddress,
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

    dispatch({ type: 'SET_SELECTORS', payload: selectors })
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
    selectVaultEpochData,
    selectAssetStrategies,
    selectAssetBalanceUsd,
    selectNetworkByVaultId,
    selectVaultNetworkById,
    selectVaultByCdoAddress,
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
    dispatch({ type: 'SET_HELPERS', payload: helpers })
  }, [
    vaultFunctionsHelper,
    genericContractsHelper
  ])

  const getChainlinkHistoricalPrices = useCallback(async (vaults: Vault[], maxDays = 365): Promise<Record<AssetId, HistoryData[]> | undefined> => {

    if (!web3 || !multiCall || !web3Chains) return

    const chainlinkHelper: ChainlinkHelper = new ChainlinkHelper(1, web3Chains[1], multiCall)

    // Get assets chainlink feeds
    const vaultsUnderlyingTokens = vaults.reduce((assets: Record<AssetId, UnderlyingTokenProps>, vault: Vault): Record<AssetId, UnderlyingTokenProps> => {
      if (!("underlyingToken" in vault) || !vault.underlyingToken || +vault.chainId !== 1) return assets
      const underlyingTokenAddress = vault.underlyingToken?.address?.toLowerCase()
      if (underlyingTokenAddress && !assets[underlyingTokenAddress]) {
        assets[underlyingTokenAddress] = vault.underlyingToken
      }
      // Add reward tokens
      if (vault.rewardTokens.length) {
        vault.rewardTokens.forEach((rewardUnderlyingToken: UnderlyingTokenProps) => {
          if (rewardUnderlyingToken.address) {
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

    const feedsCalls = Object.keys(vaultsUnderlyingTokens).reduce((calls: CallData[][], assetId: AssetId): CallData[][] => {
      const underlyingToken = vaultsUnderlyingTokens[assetId]
      const address = underlyingToken.chainlinkPriceFeed?.address || assetId

      const rawCallUsd = chainlinkHelper.getUsdFeedAddressRawCall(address, assetId)
      const callDataUsd = rawCallUsd && multiCall && multiCall.getDataFromRawCall(rawCallUsd.call, rawCallUsd)
      if (!callDataUsd) return calls

      calls[0].push(callDataUsd)
      return calls
    }, [[], []])

    const [
      feedsUsd
      // @ts-ignore
    ] = await multiCall.executeMultipleBatches(feedsCalls, 1, web3Chains[1])

    // Group feeds by asset
    const assetsFeedsUsd = feedsUsd.reduce((assetsFeedsUsd: Record<AssetId, string | null>, callResult: DecodedResult): Record<AssetId, string | null> => {
      const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
      const underlyingToken = vaultsUnderlyingTokens[assetId]
      const feedAddress = callResult.data || underlyingToken.chainlinkPriceFeed?.feedUsdAddress
      if (!feedAddress) return assetsFeedsUsd // Feed not found
      return {
        ...assetsFeedsUsd,
        [assetId]: feedAddress
      }
    }, {})

    // Get feeds rounds bounds (timestamp, latestRound, latestTimestamp)
    const feedsUsdRoundBoundsCalls = Object.keys(assetsFeedsUsd).reduce((calls: CallData[][], assetId: string) => {
      const feedUsdAddress = assetsFeedsUsd[assetId]
      if (!feedUsdAddress || !multiCall) return calls
      const feedRoundBoundsRawCalls = chainlinkHelper.getFeedRoundBoundsRawCalls(assetId, feedUsdAddress)
      const newCalls = multiCall.getCallsFromRawCalls(feedRoundBoundsRawCalls)

      // Group by index
      newCalls.forEach((callData: CallData, index: number) => {
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

    if (!feedsUsdTimestampResults) return

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
    const feedsUsdRoundBounds = Array.from(Array(feedsUsdTimestampResults.length).keys()).reduce((feedsUsdRoundBounds: Record<AssetId, FeedRoundBounds>, callIndex: number): Record<AssetId, FeedRoundBounds> => {
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
    const historicalPricesCalls = Object.keys(vaultsUnderlyingTokens).reduce((calls: CallData[], assetId: AssetId): CallData[] => {
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
    results?.forEach((callResult: DecodedResult) => {
      if (callResult.data) {
        const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
        const asset = selectAssetById(assetId)
        if (asset) {
          const date = +(dayjs(+callResult.data.startedAt * 1000).startOf('day').valueOf())
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

    const historicalPricesUsd: Record<AssetId, HistoryData[]> = Object.keys(assetsPricesUsd).reduce((historicalPricesUsd: Record<AssetId, HistoryData[]>, assetId: AssetId) => {
      return {
        ...historicalPricesUsd,
        [assetId]: Object.values(assetsPricesUsd[assetId])
      }
    }, {})

    // console.log('historicalPricesUsd', historicalPricesUsd)

    return historicalPricesUsd
  }, [web3, web3Chains, multiCall, selectAssetById])

  const loadVaultsRequests = useCallback(async () => {
    // Get vaults from APIs
    const vaultsData = await getVaultsFromApiV2();
    if (!vaultsData){
      return []
    }
    
    // Get latest vaultBlocks from APIs
    const vaultIds = vaultsData.map( (vaultData: any) => vaultData._id )
    const vaultBlocks = await getLatestVaultBlocks(vaultIds)
    return vaultBlocks.reduce( (acc: Record<AssetId, VaultBlockRequest[]>, vaultBlock: any) => {
      const vaultId = vaultBlock.vaultAddress.toLowerCase()
      return {
        ...acc,
        [vaultId]: vaultBlock.requests
      }
    }, {})
  }, [])

  useEffect(() => {
    if (isEmpty(state.vaults) || state.isVaultsLoaded || runningEffects.current.vaultsLoading === true) return

    ;(async() => {

      runningEffects.current.vaultsLoading = true

      const startTimestamp = Date.now()
      // Get vaults from APIs
      const cacheKeyVaults = `apiv2_vaults`
      const callbackVaults = async () => getVaultsFromApiV2()
      const vaultsData = cacheProvider
        ? await cacheProvider.checkAndCache(cacheKeyVaults, callbackVaults, 300)
        : await callbackVaults();

      if (!vaultsData){
        runningEffects.current.vaultsLoading = false
        dispatch({ type: 'SET_VAULTS_LOADED', payload: true })
        return
      }

      // Get latest vaultBlocks from APIs
      const vaultIds = vaultsData.map( (vaultData: any) => vaultData._id )
      const vaultBlocks = await getLatestVaultBlocks(vaultIds)
      
      if (!vaultBlocks){
        runningEffects.current.vaultsLoading = false
        dispatch({ type: 'SET_VAULTS_LOADED', payload: true })
        return
      }

      const aprs: Balances = {}
      const pricesUsd: Balances = {}
      const vaultsPrices: Balances = {}
      const totalSupplies: Balances = {}
      const aprsBreakdown: Record<AssetId, Balances> = {}
      const vaultsRequests: Record<AssetId, VaultBlockRequest[]> = {}

      vaultBlocks.forEach( (vaultBlock: any) => {
        const vault = state.vaults.find( (vault: Vault) => vaultBlock && cmpAddrs(vault.id, vaultBlock.vaultAddress) )

        if (!vault){
          // console.log('Vault not found: ', vaultBlock?.vaultAddress)
          return
        }

        const decimals =
          "underlyingToken" in vault && vault.underlyingToken?.decimals
            ? vault.underlyingToken?.decimals
            : 18;
        
        const apr = bnOrZero(vaultBlock?.APRs?.GROSS)
        const priceUsd = bnOrZero(vaultBlock?.TVL?.USD).eq(vaultBlock?.TVL?.token) ? BNify(1) : fixTokenDecimals(vaultBlock?.TVL?.USD, 6).div(fixTokenDecimals(vaultBlock?.TVL?.token, 18))
        const totalSupply = fixTokenDecimals(vaultBlock.totalSupply, 18)
        const vaultPrice = fixTokenDecimals(vaultBlock.price, decimals)

        aprs[vault.id] = apr
        pricesUsd[vault.id] = priceUsd
        totalSupplies[vault.id] = totalSupply
        vaultsPrices[vault.id] = vaultPrice
        vaultsRequests[vault.id] = vaultBlock.requests
        aprsBreakdown[vault.id] = {
          base: apr
        }
      })

      console.log('VAULTS DATA LOADED in ', (Date.now() - startTimestamp) / 1000, 'seconds')
      runningEffects.current.vaultsLoading = false

      // Set portfolio loaded = true
      dispatch({ type: 'SET_APRS', payload: aprs })
      dispatch({ type: 'SET_APRS_BREAKDOWN', payload: aprsBreakdown })
      dispatch({ type: 'SET_PRICES_USD', payload: pricesUsd })
      dispatch({ type: 'SET_TOTAL_SUPPLIES', payload: totalSupplies })
      dispatch({ type: 'SET_VAULTS_PRICES', payload: vaultsPrices })
      dispatch({ type: 'SET_VAULTS_REQUESTS', payload: vaultsRequests })
      dispatch({ type: 'SET_VAULTS_LOADED', payload: true })
      dispatch({ type: 'SET_PORTFOLIO_LOADED', payload: true })
    })()
  }, [state.vaults, state.isVaultsLoaded, cacheProvider])

  // Get tokens prices, balances, rates
  useEffect(() => {
    // console.log('Load portfolio', state.vaults, state.contracts, multiCall, isEmpty(state.aprs), account?.address, runningEffects.current.portfolioLoading);
    if (!state.isVaultsLoaded || !state.contracts.length || !multiCall || runningEffects.current.portfolioLoading === (account?.address || true)) return

    // Avoid refreshing if disconnected and already loaded data
    if (!isEmpty(state.fees) && !account?.address) {
      return dispatch({ type: 'SET_PORTFOLIO_LOADED', payload: true })
    }

    // dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})

    ; (async () => {

      runningEffects.current.portfolioLoading = account?.address || true

      const startTimestamp = Date.now()

      // Update balances only if account changed
      const enabledCalls: string[] = isEmpty(state.fees) ? [] : ['balances', 'rewards', 'auth']

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
        poolsData,
        maticNFTs,
        totalAprs,
        // assetsData,
        gaugesData,
        // stakingData,
        epochsData,
        openVaults,
        allocations,
        pausedVaults,
        lastHarvests,
        vaultsPrices,
        protocolsAprs,
        aprsBreakdown,
        vaultsRewards,
        totalSupplies,
        currentRatios,
        additionalAprs,
        walletAllowed,
        ethenaCooldowns,
        idleDistributions,
        interestBearingTokens,
        morphoRewardsEmissions,
        gearboxPointsEmissions
      } = vaultsOnChainData

      // const gaugeWeights = await getGaugesWeights(state.vaults)

      // Always update assets data
      // dispatch({type: 'SET_ASSETS_DATA', payload: {...state.assetsData, ...assetsData}})
      const newState: any = {}

      // dispatch({type: 'SET_STAKING_DATA', payload: stakingData})
      // dispatch({type: 'SET_LAST_HARVESTS', payload: {...state.lastHarvests, ...lastHarvests}})

      // newState.stakingData = stakingData
      newState.totalAprs = { ...state.totalAprs, ...totalAprs }
      newState.epochsData = { ...state.epochsData, ...epochsData }
      newState.openVaults = { ...state.openVaults, ...openVaults }
      newState.lastHarvests = { ...state.lastHarvests, ...lastHarvests }
      newState.pausedVaults = { ...state.pausedVaults, ...pausedVaults }
      newState.walletAllowed = { ...state.walletAllowed, ...walletAllowed }
      newState.interestBearingTokens = { ...state.interestBearingTokens, ...interestBearingTokens }

      if (!enabledCalls.length || enabledCalls.includes('fees')) {
        const payload = !enabledCalls.length || accountChanged ? fees : { ...state.fees, ...fees }
        newState.fees = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('limits')) {
        const payload = !enabledCalls.length || accountChanged ? limits : { ...state.limits, ...limits }
        newState.limits = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? aprRatios : { ...state.aprRatios, ...aprRatios }
        newState.aprRatios = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? currentRatios : { ...state.currentRatios, ...currentRatios }
        newState.currentRatios = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? baseAprs : { ...state.baseAprs, ...baseAprs }
        newState.baseAprs = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? idleDistributions : { ...state.idleDistributions, ...idleDistributions }
        newState.idleDistributions = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('protocols')) {
        const payload = !enabledCalls.length || accountChanged ? protocolsAprs : { ...state.protocolsAprs, ...protocolsAprs }
        newState.protocolsAprs = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('protocols')) {
        const payload = !enabledCalls.length || accountChanged ? poolsData : { ...state.poolsData, ...poolsData }
        newState.poolsData = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('protocols')) {
        const payload = !enabledCalls.length || accountChanged ? allocations : { ...state.allocations, ...allocations }
        newState.allocations = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? aprs : { ...state.aprs, ...aprs }
        newState.aprs = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? additionalAprs : { ...state.additionalAprs, ...additionalAprs }
        newState.additionalAprs = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('aprs')) {
        const payload = !enabledCalls.length || accountChanged ? aprsBreakdown : { ...state.aprsBreakdown, ...aprsBreakdown }
        newState.aprsBreakdown = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        const payload = !enabledCalls.length || accountChanged ? rewards : { ...state.rewards, ...rewards }
        newState.rewards = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        // console.log('SET_VAULTS_REWARDS', enabledCalls, state.vaultsRewards, vaultsRewards)
        const payload = !enabledCalls.length || accountChanged ? vaultsRewards : { ...state.vaultsRewards, ...vaultsRewards }
        newState.vaultsRewards = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        const payload = !enabledCalls.length || accountChanged ? balances : { ...state.balances, ...balances }
        newState.balances = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        newState.maticNFTs = maticNFTs
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        newState.ethenaCooldowns = ethenaCooldowns
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        newState.morphoRewardsEmissions = morphoRewardsEmissions
      }
      if (!enabledCalls.length || enabledCalls.includes('rewards')) {
        newState.gearboxPointsEmissions = gearboxPointsEmissions
      }
      if (!enabledCalls.length || enabledCalls.includes('balances')) {
        const payload = !enabledCalls.length || accountChanged ? gaugesData : { ...state.gaugesData, ...gaugesData }
        newState.gaugesData = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('pricesUsd')) {
        const payload = !enabledCalls.length || accountChanged ? pricesUsd : { ...state.pricesUsd, ...pricesUsd }
        newState.pricesUsd = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('prices')) {
        const payload = !enabledCalls.length || accountChanged ? vaultsPrices : { ...state.vaultsPrices, ...vaultsPrices }
        newState.vaultsPrices = payload
      }
      if (!enabledCalls.length || enabledCalls.includes('totalSupplies')) {
        const payload = !enabledCalls.length || accountChanged ? totalSupplies : { ...state.totalSupplies, ...totalSupplies }
        newState.totalSupplies = payload
      }

      // console.log('postfolioLoaded', newState)

      dispatch({ type: 'SET_STATE', payload: newState })

      // Don't update if partial loading
      if (!state.isPortfolioLoaded || accountChanged) {
        dispatch({ type: 'SET_PORTFOLIO_LOADED', payload: true })
      }

      // runningEffects.current.portfolioLoading = false

      // eslint-disable-next-line
      console.log('PORTFOLIO LOADED in ', (Date.now() - startTimestamp) / 1000, 'seconds')
    })()

    // Cleanup
    return () => {
      // dispatch({type: 'SET_APRS', payload: {}})
      dispatch({ type: 'SET_REWARDS', payload: {} })
      dispatch({ type: 'SET_BALANCES', payload: {} })
      dispatch({ type: 'SET_MATIC_NTFS', payload: [] })
      // dispatch({type: 'SET_GAUGES_DATA', payload: {}})
      dispatch({ type: 'SET_VAULTS_REWARDS', payload: {} })
      dispatch({ type: 'SET_ETHENA_COOLDOWNS', payload: [] })
      // dispatch({type: 'SET_PRICES_USD', payload: {}})
      // dispatch({type: 'SET_VAULTS_PRICES', payload: {}})
      // dispatch({type: 'SET_TOTAL_SUPPLIES', payload: {}})
      // dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})
      // console.log('RESET PORTFOLIO')
    };
    // eslint-disable-next-line
  }, [account, state.vaults, state.isVaultsLoaded, state.contracts])

  // Get historical underlying prices from chainlink
  useEffect(() => {

    if (isEmpty(state.vaults) || !isEmpty(state.historicalPricesUsd) || !web3 || !multiCall || !storedHistoricalPricesUsdLoaded || runningEffects.current.historicalPricesUsd === true) return

    // console.log('Check historicalPricesUsd', storedHistoricalPricesUsdLoaded, storedHistoricalPricesUsd)
    runningEffects.current.historicalPricesUsd = true

    // Load 1 year by default
    let maxDays = 365

    // Prices are already stored
    if (!isEmpty(storedHistoricalPricesUsd) && storedHistoricalPricesUsd.timestamp) {
      const latestStoredTimestamp = Object.keys(storedHistoricalPricesUsd.historicalPricesUsd).reduce((latestStoredTimestamp: number, assetId) => {
        const latestAssetData: HistoryData = (Object.values(storedHistoricalPricesUsd.historicalPricesUsd[assetId]).pop() as HistoryData)
        if (latestAssetData) {
          if (!latestStoredTimestamp || latestAssetData.date < latestStoredTimestamp) {
            latestStoredTimestamp = latestAssetData.date
          }
        }
        return latestStoredTimestamp
      }, Date.now())
      const daysDiff = dayDiff(Date.now(), latestStoredTimestamp)
      // console.log('storedHistoricalPricesUsd', Date.now(), latestStoredTimestamp, daysDiff)
      if (!daysDiff) {
        // console.log('storedHistoricalPricesUsd', storedHistoricalPricesUsd.historicalPricesUsd)
        return dispatch({ type: 'SET_HISTORICAL_PRICES_USD', payload: storedHistoricalPricesUsd.historicalPricesUsd })
      } else {
        // Load missing days
        maxDays = daysDiff
      }
    }

    // Get Historical data
    ; (async () => {
      // const startTimestamp = Date.now()
      const historicalPricesUsd = await getChainlinkHistoricalPrices(state.vaults, maxDays)
      // console.log('getChainlinkHistoricalPrices', maxDays, historicalPricesUsd)

      if (!historicalPricesUsd) return

      // Merge new with stored prices
      const mergedHistoricalPricesUsd = storedHistoricalPricesUsd.historicalPricesUsd ? { ...storedHistoricalPricesUsd.historicalPricesUsd } : {}
      Object.keys(historicalPricesUsd).forEach((assetId: AssetId) => {
        const assetPricesUsd = historicalPricesUsd[assetId]
        if (!mergedHistoricalPricesUsd[assetId]) {
          mergedHistoricalPricesUsd[assetId] = []
        }

        // Just store new prices
        if (mergedHistoricalPricesUsd[assetId].length) {
          const latestTimestamp = [...mergedHistoricalPricesUsd[assetId]].pop().date
          const newAssetPricesUSd = assetPricesUsd.filter(assetPriceUsd => +assetPriceUsd.date > +latestTimestamp)
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
      Object.keys(mergedHistoricalPricesUsd).forEach((assetId: AssetId) => {
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

      dispatch({ type: 'SET_HISTORICAL_PRICES_USD', payload: mergedHistoricalPricesUsd })
    })()
    // eslint-disable-next-line
  }, [state.vaults, web3, multiCall, storedHistoricalPricesUsdLoaded, getChainlinkHistoricalPrices])

  // Get historical vaults data
  useEffect(() => {
    if (isEmpty(state.vaults) || !state.isPortfolioLoaded || !vaultFunctionsHelper || !isEmpty(state.historicalRates) || !!runningEffects.current.historicalVaults) return

    // console.log('Load historical data', state.vaults, state.isPortfolioLoaded, vaultFunctionsHelper, state.historicalRates, runningEffects.current.historicalVaults)

    runningEffects.current.historicalVaults = true

      // Get Historical data
      ; (async () => {
        const startTimestamp = Date.now();

        // Fetch historical data from the first deposit (min 1 year)
        const vaultsHistoricalDataPromises = state.vaults.reduce((promises: Promise<any>[], vault: Vault): Promise<any>[] => {
          const asset = selectAssetById(vault.id)
          if (asset) {
            // const firstDepositTimestamp = asset.vaultPosition?.firstDepositTx?.timeStamp
            const startTime = ("stats" in vault) && vault.stats?.startTimestamp ? Math.round(+vault.stats?.startTimestamp / 1000) : dayjs().subtract(1, 'year').unix()
            const start = Math.round(dayjs(+startTime * 1000).startOf('day').valueOf() / 1000)
            const end = Math.round(dayjs().endOf('day').valueOf() / 1000)

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
          vaultsCollectedFees
        ] = await Promise.all([
          Promise.all(vaultsHistoricalDataPromises),
          vaultFunctionsHelper.getVaultsCollectedFees(state.vaults)
        ])

        // console.log('vaultsCollectedFees', vaultsCollectedFees)

        const tvls: Record<AssetId, HistoryData[]> = {}
        const rates: Record<AssetId, HistoryData[]> = {}
        const prices: Record<AssetId, HistoryData[]> = {}
        // const tvlsUsd: Record<AssetId, HistoryData[]> = {}

        vaultsHistoricalData.forEach((vaultHistoricalData: VaultHistoricalData) => {
          const assetId = vaultHistoricalData.vaultId
          const asset = selectAssetById(assetId)
          if (asset) {
            tvls[assetId] = vaultHistoricalData.tvls
            rates[assetId] = vaultHistoricalData.rates
            prices[assetId] = vaultHistoricalData.prices

            const ratesSum = rates[assetId].reduce((total: BigNumber, rate: HistoryData) => total.plus(rate.value), BNify(0))
            if (bnOrZero(ratesSum).lte(0)) {
              rates[assetId] = []
              // const firstPoint = prices[assetId][0] as HistoryData
              prices[assetId].forEach((data: HistoryData, index: number) => {
                if (index > 7) {
                  const prevPoint = prices[assetId][index - 7]
                  const gainPercentage = BNify(data.value).div(bnOrZero(prevPoint.value)).minus(1)
                  const secondsDiff = Math.round((data.date - prevPoint.date) / 1000)
                  const apy = gainPercentage.times(SECONDS_IN_YEAR).div(secondsDiff).times(100)
                  rates[assetId].push({
                    date: data.date,
                    value: apy.toNumber()
                  })
                  // console.log(data.date, gainPercentage.toString(), secondsDiff, apy.toString())
                }
              })
            }

            dispatch({ type: 'SET_ASSET_DATA', payload: { assetId, assetData: { tvls: tvls[assetId], rates: rates[assetId], prices: prices[assetId] } } })
          }
        })

        dispatch({ type: 'SET_HISTORICAL_TVLS', payload: tvls })
        dispatch({ type: 'SET_HISTORICAL_RATES', payload: rates })
        dispatch({ type: 'SET_HISTORICAL_PRICES', payload: prices })
        dispatch({ type: 'SET_VAULTS_COLLECTED_FEES', payload: vaultsCollectedFees })

        // eslint-disable-next-line
        console.log('HISTORICAL DATA LOADED in ', (Date.now() - startTimestamp) / 1000, 'seconds')
      })()

    // eslint-disable-next-line
  }, [state.vaults, state.isPortfolioLoaded])

  // Get staking data
  useEffect(() => {
    if (!multiCall || !web3Chains || isEmpty(state.vaults) || !state.isPortfolioAccountReady || !vaultFunctionsHelper || runningEffects.current.stakingData === (account?.address || true)) return

      ; (async () => {

        runningEffects.current.stakingData = account?.address || true

        const startTimestamp = Date.now()
        const stkIdleCalls = getStkIdleCalls()
        const stakedIdleVault = state.vaults.find((vault: Vault) => vault.type === 'STK') as StakedIdleVault

        const [
          stkIdleResults,
          stakedIdleVaultRewards
        ] = await Promise.all([
          multiCall.executeMulticalls(stkIdleCalls, true, STAKING_CHAINID, web3Chains[STAKING_CHAINID]),
          vaultFunctionsHelper.getStakingRewards(stakedIdleVault, STAKING_CHAINID)
        ])

        if (!stkIdleResults) {
          runningEffects.current.stakingData = false
          return
        }

        const [
          stkIdleTotalLocked,
          stkIdleTotalSupply,
          stkIdleLock,
          stkIdleBalance,
          stkIdleClaimable
        ] = stkIdleResults.map(r => r.data)

        const totalDiscountedFees = BNify(0)
        const firstRewardTimestamp: number = stakedIdleVaultRewards?.length ? +(stakedIdleVaultRewards[0] as EtherscanTransaction).timeStamp : 0
        const lastRewardTimestamp: number = stakedIdleVaultRewards?.length ? +(stakedIdleVaultRewards[stakedIdleVaultRewards.length - 1] as EtherscanTransaction).timeStamp : 0
        const stkIdletotalRewardsDays = stakedIdleVaultRewards?.length ? Math.abs(lastRewardTimestamp - firstRewardTimestamp) / 86400 : 0
        const stkIdleTotalRewards: BigNumber = stakedIdleVaultRewards.reduce((total: BigNumber, tx: EtherscanTransaction) => total.plus(fixTokenDecimals(tx.value, 18)), BNify(0))
        const maxApr = stkIdleTotalRewards.div(fixTokenDecimals(stkIdleTotalSupply, 18)).times(365.2425).div(stkIdletotalRewardsDays).times(100)
        const avgLockTime = parseFloat(fixTokenDecimals(stkIdleTotalSupply, 18).div(fixTokenDecimals(stkIdleTotalLocked, 18)).times(MAX_STAKING_DAYS).toFixed())

        const feeDiscount = getFeeDiscount(fixTokenDecimals(stkIdleBalance, 18))

        // console.log(`stkIdleTotalRewards: ${stkIdleTotalRewards.toFixed()}, stkIdleTotalLocked: ${fixTokenDecimals(stkIdleTotalLocked, 18).toFixed()}, stkIdletotalRewardsDays: ${stkIdletotalRewardsDays.toFixed()}`)

        const stakingData: StakingData = {
          maxApr,
          avgLockTime,
          feeDiscount,
          totalDiscountedFees,
          rewards: stakedIdleVaultRewards,
          rewardsDays: stkIdletotalRewardsDays,
          position: {
            lockEnd: +stkIdleLock.end * 1000,
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

        dispatch({ type: 'SET_STAKING_DATA', payload: stakingData })

        // eslint-disable-next-line
        console.log('STAKING DATA LOADED in ', (Date.now() - startTimestamp) / 1000, 'seconds')
      })()
    // eslint-disable-next-line
  }, [multiCall, web3Chains, vaultFunctionsHelper, state.vaults, account, state.isPortfolioAccountReady])

  // Get historical collected fees
  /*
  useEffect(() => {
    if (isEmpty(state.vaults) || +chainId !== 1 || +chainId !== +state.vaultsChain || !state.isPortfolioAccountReady || !vaultFunctionsHelper || !isEmpty(state.vaultsCollectedFees) || runningEffects.current?.vaultsCollectedFeesProcessing || +(runningEffects.current?.vaultsCollectedFees || 0)>5) return

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

      // console.log('vaultsCollectedFees', state.vaultsChain, runningEffects.current.vaultsCollectedFees, chainId, state.vaults, vaultsCollectedFees)

      // eslint-disable-next-line
      console.log('COLLECTED FEES LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()
  // eslint-disable-next-line
  }, [state.vaults, state.vaultsChain, state.isPortfolioAccountReady, vaultFunctionsHelper])
  */

  // Calculate historical USD Tvls
  useEffect(() => {
    if (isEmpty(state.historicalPricesUsd) || isEmpty(state.historicalTvls)) return
    const historicalTvlsUsd = Object.keys(state.historicalTvls).reduce((historicalTvlsUsd: InitialState["historicalTvlsUsd"], assetId: AssetId) => {
      if (!state.historicalTvls[assetId]/* || !state.historicalPricesUsd[assetId]*/) return historicalTvlsUsd
      historicalTvlsUsd[assetId] = state.historicalTvls[assetId].map((data: HistoryData) => {
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

    dispatch({ type: 'SET_HISTORICAL_TVLS_USD', payload: historicalTvlsUsd })

    // const totalTvl = calculateTotalHistoricalTvl(historicalTvlsUsd)

    // eslint-disable-next-line
  }, [state.historicalPricesUsd, state.historicalTvls])

  // Get user vaults positions
  useEffect(() => {
    // console.log('Load Vaults Positions', account?.address, disconnecting, state.balances, state.vaultsPositions, state.isPortfolioLoaded, walletInitialized, connecting, runningEffects.current.vaultsPositions)
    if (!account?.address || disconnecting || !state.isPortfolioLoaded || isEmpty(state.balances) || !walletInitialized || connecting || runningEffects.current.vaultsPositions === (account?.address || true)) return

      ; (async () => {
        runningEffects.current.vaultsPositions = account?.address || true

        const [
          results,
          vaultsAccountData
        ] = await Promise.all([
          getVaultsPositions(state.vaults),
          getVaultsAccountData(state.vaults)
        ])

        const {
          vaultsPositions,
          discountedFees,
          distributedRewards,
          vaultsTransactions
        } = results

        dispatch({ type: 'SET_VAULTS_POSITIONS_LOADED', payload: true })
        dispatch({ type: 'SET_DISCOUNTED_FEES', payload: discountedFees })
        dispatch({ type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions })
        dispatch({ type: 'SET_VAULTS_ACCOUNT_DATA', payload: vaultsAccountData })
        dispatch({ type: 'SET_DISTRIBUTED_REWARDS', payload: distributedRewards })
        dispatch({ type: 'SET_VAULTS_TRANSACTIONS', payload: vaultsTransactions })

        runningEffects.current.vaultsPositions = false
      })()

    // Clean transactions and positions
    return () => {
      dispatch({ type: 'SET_DISCOUNTED_FEES', payload: [] })
      dispatch({ type: 'SET_VAULTS_POSITIONS', payload: {} })
      dispatch({ type: 'SET_DISTRIBUTED_REWARDS', payload: {} })
      dispatch({ type: 'SET_VAULTS_TRANSACTIONS', payload: [] })
      dispatch({ type: 'SET_VAULTS_ACCOUNT_DATA', payload: {} })
      dispatch({ type: 'SET_VAULTS_POSITIONS_LOADED', payload: false })
    }
    // eslint-disable-next-line
  }, [account, state.isPortfolioLoaded, getVaultsAccountData, disconnecting, state.balances, state.portfolioTimestamp, walletInitialized, connecting])

  // Calculate discounted fees
  useEffect(() => {
    if (!web3Chains || disconnecting || !state.contractsNetworks || !state.isVaultsPositionsLoaded || isEmpty(state.vaultsPositions) || isEmpty(state.historicalPricesUsd) || isEmpty(state.historicalPrices) || isEmpty(state.discountedFees) || runningEffects.current.discountedFees === (account?.address || true)) return;
    ; (async () => {

      runningEffects.current.discountedFees = account?.address || true

      const vaultsPositions = { ...state.vaultsPositions }

      const discountedFees = await asyncReduce<AssetId, VaultsPositions["discountedFees"]>(
        Object.keys(state.discountedFees),
        async (assetId) => {
          const discountedFees = state.discountedFees
          const asset = selectAssetById(assetId)
          const vaultPosition = selectVaultPosition(assetId)
          if (!asset || !vaultPosition || !asset.chainId) return discountedFees
          const assetChainId = +asset.chainId
          if (!isEmpty(state.discountedFees[assetId])) {
            await asyncForEach(state.discountedFees[assetId], async (discountedFee: DistributedReward, index: number) => {
              const underlyingToken = selectUnderlyingTokenByAddress(assetChainId, asset.underlyingId as string)
              if (!underlyingToken) return
              const genericContractsHelper = new GenericContractsHelper({ chainId: assetChainId, web3: web3Chains[assetChainId], contracts: state.contractsNetworks[assetChainId] })

              const discountedFeeAssetId = discountedFee.assetId

              const txTimestamp = floorTimestamp(discountedFee.timeStamp)

              // Get vault price
              const vaultPriceData = selectAssetHistoricalPriceByTimestamp(discountedFeeAssetId, txTimestamp)
              const underlyingTokenPriceUsdData = selectAssetHistoricalPriceUsdByTimestamp(underlyingToken.address, txTimestamp)

              const vaultPrice = vaultPriceData ? BNify(vaultPriceData.value) : BNify(1)
              const underlyingTokenPriceUsd = underlyingTokenPriceUsdData ? BNify(underlyingTokenPriceUsdData.value) : await genericContractsHelper.getConversionRate(underlyingToken, +discountedFee.tx.blockNumber)

              const discountedFeesUnderlyingAmount = discountedFee.value.times(vaultPrice)
              const discountedFeesUsd = discountedFeesUnderlyingAmount.times(underlyingTokenPriceUsd)
              // const apr = discountedFeesUsd.div(distributionVaults.totalRedeemable).times(52.1429)
              discountedFees[assetId][index].value = discountedFeesUnderlyingAmount

              // Update realized apy on vaultPosition

              // Add rewards and earnings
              vaultPosition.underlying.discountedFees = bnOrZero(vaultPosition.underlying.discountedFees).plus(discountedFeesUnderlyingAmount);
              vaultPosition.usd.discountedFees = bnOrZero(vaultPosition.usd.discountedFees).plus(discountedFeesUsd);

              vaultsPositions[assetId] = vaultPosition
            })
          }
          return discountedFees
        },
        (discountedFees, assetDiscountedFees) => {
          return {
            ...discountedFees,
            ...assetDiscountedFees
          }
        },
        { ...state.discountedFees }
      )

      dispatch({ type: 'SET_DISCOUNTED_FEES', payload: discountedFees })
      dispatch({ type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions })
    })()

    // Clean transactions and positions
    return () => {
      // runningEffects.current.discountedFees = false
      // dispatch({type: 'SET_DISTRIBUTED_REWARDS', payload: {}})
    }
  }, [state.discountedFees, disconnecting, selectVaultPosition, state.vaultsPositions, state.isVaultsPositionsLoaded, state.historicalPricesUsd, selectAssetHistoricalPriceUsdByTimestamp, selectAssetHistoricalPrices, selectAssetHistoricalPriceByTimestamp, state.historicalPrices, selectAssetById, state.contractsNetworks, web3Chains, account?.address])

  // Calculate distributed rewards APYs
  useEffect(() => {
    if (!web3Chains || isEmpty(state.historicalPricesUsd) || !state.contractsNetworks || !state.isVaultsPositionsLoaded || isEmpty(state.distributedRewards) || runningEffects.current.distributedRewards === (account?.address || true)) return;
  
    ; (async () => {

      runningEffects.current.distributedRewards = account?.address || true

      /*
      const distributionVaults = Object.keys(state.distributedRewards).reduce( (distributionVaults: Record<string, BigNumber>, assetId: AssetId) => {
        if (isEmpty(state.distributedRewards[assetId])) return distributionVaults
        const vaultPosition = selectVaultPosition(assetId)
        if (!vaultPosition) return distributionVaults
        distributionVaults.totalVaults = distributionVaults.totalVaults.plus(1)
        distributionVaults.totalRedeemable = distributionVaults.totalRedeemable.plus(vaultPosition.usd.redeemable)
        return distributionVaults
      }, {
        totalVaults: BNify(0),
        totalRedeemable: BNify(0)
      })
      */

      // console.log('historicalPricesUsd', state.historicalPricesUsd)

      const distributedRewards = await asyncReduce<AssetId, VaultsPositions["distributedRewards"]>(
        Object.keys(state.distributedRewards),
        async (assetId) => {
          const distributedRewardsOutput = state.distributedRewards
          const asset = selectAssetById(assetId)
          const vaultPosition = selectVaultPosition(assetId)
          if (!asset || !vaultPosition || !asset.chainId || !asset.underlyingId){
            return distributedRewardsOutput
          }
          const assetChainId = +asset.chainId
          // const underlyingToken = selectUnderlyingTokenByAddress(assetChainId, asset.underlyingId)

          await asyncForEach(Object.keys(state.distributedRewards[assetId]), async (rewardId: AssetId) => {
            const rewardToken = selectUnderlyingTokenByAddress(assetChainId, rewardId)
            if (!rewardToken) return

            const genericContractsHelper = new GenericContractsHelper({ chainId: assetChainId, web3: web3Chains[assetChainId], contracts: state.contractsNetworks[assetChainId] })

            if (state.distributedRewards[assetId][rewardId].length > 0) {

              const distributedRewardsConversionRates = await Promise.all(
                state.distributedRewards[assetId][rewardId].map((distributedReward: DistributedReward) => genericContractsHelper.getConversionRate(rewardToken, +distributedReward.blockNumber).then((conversionRate: any) => ({ blockNumber: distributedReward.blockNumber, conversionRate })))
              )

              const {
                num,
                den,
                totalRewardsUsd
              } = state.distributedRewards[assetId][rewardId].reduce((acc: Record<string, BigNumber>, distributedReward: DistributedReward) => {
                // Get latest balance before the distribution
                const latestBalance = bnOrZero((vaultPosition.balancePeriods.filter((balancePeriod: BalancePeriod) => +balancePeriod.blockNumber <= +distributedReward.blockNumber).pop())?.balance)
                const conversionRateData = distributedRewardsConversionRates.find((conversionRateData: { blockNumber: number, conversionRate: BigNumber }) => +conversionRateData.blockNumber === +distributedReward.blockNumber)
                if (conversionRateData && latestBalance.gt(0)) {
                  distributedReward.valueUsd = conversionRateData.conversionRate.times(distributedReward.value)

                  // Convert reward in vault underlying token
                  const foundConversionRate = state.historicalPricesUsd[asset.underlyingId as string]?.find( (rate: HistoryData) => rate.date === +dayjs(+distributedReward.timeStamp).startOf("day").valueOf() )
                  const underlyingTokenConversionRateUsd = BNify(foundConversionRate?.value || 1)

                  const latestBalanceUsd = latestBalance.times(underlyingTokenConversionRateUsd)

                  // Check if first deposit is older than a week, otherwise annualize using the balance period
                  let distributedRewardUsdAnnualized = BNify(0)
                  const secondsFromFirstDeposit = BNify(distributedReward.timeStamp).div(1000).minus(bnOrZero(vaultPosition.firstDepositTx?.timeStamp))
                  if (secondsFromFirstDeposit.div(86400).gte(7)) {
                    distributedRewardUsdAnnualized = bnOrZero(distributedReward.valueUsd).times(WEEKS_PER_YEAR)
                  } else {
                    distributedRewardUsdAnnualized = bnOrZero(distributedReward.valueUsd).times(SECONDS_IN_YEAR).div(secondsFromFirstDeposit)
                  }

                  distributedReward.apr = distributedRewardUsdAnnualized.div(latestBalanceUsd).times(100)

                  acc.den = acc.den.plus(latestBalance)
                  acc.num = acc.num.plus(distributedReward.apr.times(latestBalance))
                  acc.totalRewardsUsd = acc.totalRewardsUsd.plus(bnOrZero(distributedReward.valueUsd))
                  // console.log('Reward avgAPY', assetId, rewardId, distributedReward.timeStamp, bnOrZero(vaultPosition.firstDepositTx?.timeStamp).toString(), secondsFromFirstDeposit.toString(), latestBalance.toString(), underlyingTokenConversionRateUsd.toString(), latestBalanceUsd.toString(), distributedReward.value.toString(), conversionRateData.conversionRate.toString(), bnOrZero(distributedReward.valueUsd).toString(), distributedRewardUsdAnnualized.toString(), distributedReward.apr.toString())
                }
                return acc
              }, {
                num: BNify(0),
                den: BNify(0),
                totalRewardsUsd: BNify(0)
              })

              const distributedRewardsAvgApy = num.div(den)

              // Initialize rewardsApysByToken object
              if (!vaultPosition.rewardsApysByToken) {
                vaultPosition.rewardsApysByToken = {}
              }

              if (!vaultPosition.rewardsApysByToken?.[rewardId]) {
                vaultPosition.rewardsApysByToken[rewardId] = BNify(0)
              }

              // console.log('distributedRewardsAvgApy', rewardId, distributedRewardsAvgApy.toString())

              vaultPosition.rewardsApysByToken[rewardId] = vaultPosition.rewardsApysByToken[rewardId].plus(distributedRewardsAvgApy)

              // Add rewards data to vaultPosition
              vaultPosition.usd.rewards = bnOrZero(vaultPosition.usd.rewards).plus(totalRewardsUsd);
              vaultPosition.usd.earnings = vaultPosition.usd.earnings.plus(totalRewardsUsd);
              vaultPosition.rewardsApy = bnOrZero(vaultPosition.rewardsApy).plus(distributedRewardsAvgApy)
              vaultPosition.realizedApy = vaultPosition.realizedApy.plus(vaultPosition.rewardsApy);
            }
          })
          return distributedRewardsOutput
        },
        (distributedRewards, assetRewards) => {
          return {
            ...distributedRewards,
            ...assetRewards
          }
        },
        { ...state.distributedRewards }
      )
      dispatch({ type: 'SET_DISTRIBUTED_REWARDS', payload: distributedRewards })
    })()

    // Clean transactions and positions
    return () => {
      // runningEffects.current.distributedRewards = false
      // dispatch({type: 'SET_DISTRIBUTED_REWARDS', payload: {}})
    }
  }, [state.distributedRewards, state.historicalPricesUsd, selectVaultPosition, state.isVaultsPositionsLoaded, selectAssetById, state.contractsNetworks, web3Chains, account?.address])

  // Set isPortfolioAccountReady
  useEffect(() => {
    if (!walletInitialized || connecting || !state.isPortfolioLoaded) return
    const isPortfolioAccountReady = state.isPortfolioLoaded && (!account?.address || state.isVaultsPositionsLoaded)
    // console.log('isPortfolioAccountReady', walletInitialized, connecting, account, state.isPortfolioLoaded, state.isVaultsPositionsLoaded, isPortfolioAccountReady)
    dispatch({ type: 'SET_PORTFOLIO_ACCOUNT_READY', payload: isPortfolioAccountReady })

    return () => {
      dispatch({ type: 'SET_PORTFOLIO_ACCOUNT_READY', payload: false })
    }
  }, [account, state.isPortfolioLoaded, state.isVaultsPositionsLoaded, walletInitialized, connecting])

  // Update balances USD
  useEffect(() => {
    if (!account?.address || isEmpty(state.balances)/* || isEmpty(state.vaultsPositions)*/) return

    const startTimestamp = Date.now();

    const balances: Record<string, BigNumber> = {
      total: BNify(0),
    }

    const balancesUsd = Object.keys(state.balances).reduce((balancesUsd: Balances, assetId) => {
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
        if (!balances[asset.type as string]) {
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
      ...Object.keys(balances).reduce((balancesParsed: Record<string, string>, type: string) => {
        return {
          ...balancesParsed,
          [type]: bnOrZero(balances[type]).toFixed(2)
        }
      }, {})
    })

    dispatch({ type: 'SET_BALANCES_USD', payload: balancesUsd })

    // eslint-disable-next-line
    console.log('BALANCES LOADED in ', (Date.now() - startTimestamp) / 1000, 'seconds')

    // Cleanup
    return () => {
      dispatch({ type: 'SET_BALANCES_USD', payload: {} })
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

    const gaugesRewards = gaugesVaultsAssets.reduce((gaugesRewards: GaugesRewards, gauge: Asset) => {
      const gaugeData = gauge.gaugeData
      const gaugeVaultPosition = gauge.vaultPosition

      if (!gaugeData) return gaugesRewards

      for (const rewardId in gaugeData.rewards) {
        const gaugeRewardData = gaugeData.rewards[rewardId]
        const gaugeShare = gaugeVaultPosition && gauge.totalSupply ? BNify(gaugeVaultPosition.underlying.redeemable).div(gauge.totalSupply) : BNify(0)

        if (BNify(gaugeRewardData.balance).gt(0)) {
          if (!gaugesRewards[rewardId]) {
            gaugesRewards[rewardId] = {
              deposited: BNify(0),
              balance: BNify(0),
              rate: BNify(0),
              apr: BNify(0),
              gauges: []
            }
          }

          gaugesRewards[rewardId].gauges.push(gauge.id as string)

          if (gaugeVaultPosition) {
            gaugesRewards[rewardId].deposited = BNify(gaugesRewards[rewardId].deposited).plus(gaugeVaultPosition.usd.deposited)
            if (gaugeRewardData.apr) {
              gaugesRewards[rewardId].apr = BNify(gaugesRewards[rewardId].apr).plus(BNify(gaugeRewardData.apr).times(gaugeVaultPosition.usd.deposited))
            }
          }

          if (gaugeRewardData.rate) {
            gaugesRewards[rewardId].rate = BNify(gaugesRewards[rewardId].rate).plus(BNify(gaugeRewardData.rate).times(gaugeShare))
          }
          if (gaugeRewardData.balance) {
            gaugesRewards[rewardId].balance = BNify(gaugesRewards[rewardId].balance).plus(gaugeRewardData.balance)
          }
        }
      }

      return gaugesRewards
    }, {})

    for (const rewardId in gaugesRewards) {
      gaugesRewards[rewardId].apr = BNify(gaugesRewards[rewardId].apr).div(gaugesRewards[rewardId].deposited)
    }

    dispatch({ type: 'SET_GAUGES_REWARDS', payload: gaugesRewards })

    return () => {
      dispatch({ type: 'SET_GAUGES_REWARDS', payload: {} })
    }

  }, [state.vaultsPositions, state.isVaultsPositionsLoaded, state.isPortfolioLoaded, selectVaultsAssetsByType, selectVaultById])

  // Generate Assets Data
  useEffect(() => {
    if (isEmpty(state.vaults) || isEmpty(state.vaultsNetworks) || !vaultFunctionsHelper) return

    // Generate assets data 
    const assetsData: Assets = Object.keys(state.vaultsNetworks).reduce((assetsData: Assets, chainId: any) => {
      return {
        ...assetsData,
        ...generateAssetsData(state.vaultsNetworks[chainId])
      }
    }, {})

    // console.log('assetsData', assetsData)

    for (const vault of state.vaults) {
      if (state.pausedVaults[vault.id] && assetsData[vault.id].status !== 'deprecated') {
        assetsData[vault.id].status = 'paused'
        // console.log('Paused Vault', vault.id, state.pausedVaults[vault.id])
      }

      assetsData[vault.id].tvl = BNify(0)
      assetsData[vault.id].tvlUsd = BNify(0)
      assetsData[vault.id].totalTvl = BNify(0)
      assetsData[vault.id].flags = vault.flags
      assetsData[vault.id].fee = state.fees[vault.id]
      assetsData[vault.id].rewards = state.rewards[vault.id]
      assetsData[vault.id].poolData = state.poolsData[vault.id]
      assetsData[vault.id].aprRatio = state.aprRatios[vault.id]
      assetsData[vault.id].epochData = state.epochsData[vault.id]
      assetsData[vault.id].gaugeData = state.gaugesData[vault.id]
      assetsData[vault.id].allocations = state.allocations[vault.id]
      assetsData[vault.id].limit = state.limits[vault.id] || BNify(0)
      assetsData[vault.id].requests = state.vaultsRequests?.[vault.id]
      assetsData[vault.id].currentRatio = state.currentRatios[vault.id]
      assetsData[vault.id].protocolsAprs = state.protocolsAprs[vault.id]
      assetsData[vault.id].pricesUsd = state.historicalPricesUsd[vault.id]
      assetsData[vault.id].baseApr = state.baseAprs[vault.id] || BNify(0)
      assetsData[vault.id].balance = state.balances[vault.id] || BNify(0)
      assetsData[vault.id].totalApr = state.totalAprs[vault.id] || BNify(0)
      assetsData[vault.id].vaultPosition = state.vaultsPositions[vault.id]
      assetsData[vault.id].priceUsd = state.pricesUsd[vault.id] || BNify(1)
      assetsData[vault.id].lastHarvest = state.lastHarvests[vault.id] || null
      assetsData[vault.id].balanceUsd = state.balancesUsd[vault.id] || BNify(0)
      assetsData[vault.id].discountedFees = state.discountedFees[vault.id] || []
      assetsData[vault.id].vaultPrice = state.vaultsPrices[vault.id] || BNify(1)
      assetsData[vault.id].walletAllowed = (state.walletAllowed[vault.id] ?? false)
      assetsData[vault.id].totalSupply = state.totalSupplies[vault.id] || BNify(0)
      assetsData[vault.id].collectedFees = state.vaultsCollectedFees[vault.id] || []
      assetsData[vault.id].additionalApr = state.additionalAprs[vault.id] || BNify(0)
      assetsData[vault.id].distributedRewards = state.distributedRewards[vault.id] || {}
      assetsData[vault.id].idleDistribution = state.idleDistributions[vault.id] || BNify(0)
      assetsData[vault.id].interestBearingTokens = state.interestBearingTokens[vault.id] || {}
      assetsData[vault.id].vaultIsOpen = state.openVaults[vault.id] !== undefined ? state.openVaults[vault.id] : true

      // Add protocol
      if ("protocol" in vault) {
        assetsData[vault.id].protocol = vault.protocol
      }

      // Add variant
      if ("variant" in vault) {
        assetsData[vault.id].variant = vault.variant
      }

      // Update Underlying price Usd
      if (("underlyingToken" in vault) && vault.underlyingToken?.address) {
        assetsData[vault.underlyingToken.address.toLowerCase()].priceUsd = assetsData[vault.id].priceUsd
      }

      // Update staking vault priceUsd
      if (vault.type === 'STK' && ("rewardTokenConfig" in vault)) {
        const underlyingToken = assetsData[vault.rewardTokenConfig.address.toLowerCase()]
        if (underlyingToken) {
          assetsData[vault.id].priceUsd = underlyingToken.priceUsd
        }
      }

      // Set historical rates
      assetsData[vault.id].rates = state.historicalRates[vault.id] || []

      // Set historical prices
      assetsData[vault.id].prices = state.historicalPrices[vault.id] || []

      if (assetsData[vault.id].prices?.length) {
        // Calculate APY 7 days
        const prices7 = assetsData[vault.id].prices!.slice(assetsData[vault.id].prices!.length - 7)
        const prices7_last_rate = prices7 ? BNify([...prices7].pop()?.value) : BNify(0)
        const price_apy7 = prices7_last_rate.div(BNify(prices7[0].value)).minus(1).times(365).div(7).times(100)

        // console.log('prices7', vault.id, prices7, BNify(prices7[0].value).toString(), rates7_last_rate.toString(), assetsData[vault.id].apy7.toString())

        // Calculate APY 7 days
        const rates7 = assetsData[vault.id].rates!.slice(assetsData[vault.id].rates!.length - 7).map((data: HistoryData) => data.value)
        const avg_rate7 = BNify(avgArray(rates7))

        assetsData[vault.id].apy7 = avg_rate7.gt(0) ? avg_rate7 : price_apy7

        // Calculate APY 30 days
        const prices30 = assetsData[vault.id].prices!.slice(assetsData[vault.id].prices!.length - 30)
        const prices30_last_rate = prices30 ? BNify([...prices30].pop()?.value) : BNify(0)
        const price_apy30 = prices30_last_rate.div(BNify(prices30[0].value)).minus(1).times(365).div(30).times(100)

        // Calculate APY 30 days
        const rates30 = assetsData[vault.id].rates!.slice(assetsData[vault.id].rates!.length - 30).map((data: HistoryData) => data.value)
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

      if (!BNify(assetsData[vault.id].totalSupply).isNaN() && !BNify(assetsData[vault.id].vaultPrice).isNaN() && !BNify(assetsData[vault.id].priceUsd).isNaN()) {
        assetsData[vault.id].tvl = BNify(assetsData[vault.id].totalSupply).times(BNify(assetsData[vault.id].vaultPrice))
        assetsData[vault.id].tvlUsd = BNify(assetsData[vault.id].tvl).times(BNify(assetsData[vault.id].priceUsd))
        // assetsData[vault.id].totalTvl = BNify(assetsData[vault.id].tvl)

        if ("vaultConfig" in vault && assetsData[vault.id].type && ['AA', 'BB'].includes(assetsData[vault.id].type as string)) {
          const otherVaultType = assetsData[vault.id].type === 'AA' ? 'BB' : 'AA'
          const otherVault = state.vaults.find((otherVault: TrancheVault) => otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address)
          if (otherVault) {
            const otherVaultAsset = assetsData[otherVault.id]
            if (otherVaultAsset.tvl) {
              assetsData[vault.id].totalTvl = BNify(assetsData[vault.id].tvl).plus(BNify(otherVaultAsset.tvl))
              assetsData[otherVault.id].totalTvl = BNify(assetsData[vault.id].tvl).plus(BNify(otherVaultAsset.tvl))
              // console.log('Other Vault', vault.id, otherVault.id, BNify(assetsData[vault.id].tvl).toString(), BNify(otherVaultAsset.tvl).toString(), BNify(assetsData[vault.id].totalTvl).toString())
            }
            if (otherVaultAsset.tvlUsd) {
              assetsData[vault.id].totalTvlUsd = BNify(assetsData[vault.id].tvlUsd).plus(BNify(otherVaultAsset.tvlUsd))
              assetsData[otherVault.id].totalTvlUsd = BNify(assetsData[vault.id].tvlUsd).plus(BNify(otherVaultAsset.tvlUsd))
              // console.log('Other Vault', vault.id, otherVault.id, BNify(assetsData[vault.id].tvl).toString(), BNify(otherVaultAsset.tvl).toString(), BNify(assetsData[vault.id].totalTvl).toString())
            }
          }
        }

        // Set default totalTvl
        if (!assetsData[vault.id].totalTvl || bnOrZero(assetsData[vault.id].totalTvl).lt(bnOrZero(assetsData[vault.id].tvl))) {
          assetsData[vault.id].totalTvl = assetsData[vault.id].tvl
        }

        // Set default totalTvlUsd
        if (!assetsData[vault.id].totalTvlUsd || bnOrZero(assetsData[vault.id].totalTvlUsd).lt(bnOrZero(assetsData[vault.id].tvlUsd))) {
          assetsData[vault.id].totalTvlUsd = assetsData[vault.id].tvlUsd
        }
      }
    }

    // Add morpho rewards emissions or post processed data
    for (const vault of state.vaults) {

      let rewardsEmissionsTotalApr = BNify(0)

      // Init rewards emissions
      assetsData[vault.id].rewardsEmissions = {}

      if (("cdoConfig" in vault)) {

        // Morpho rewards
        if (!isEmpty(state.morphoRewardsEmissions[vault.cdoConfig.address])) {
          const vaultRewardsEmissions = state.morphoRewardsEmissions[vault.cdoConfig.address]
          assetsData[vault.id].rewardsEmissions = Object.keys(vaultRewardsEmissions).reduce((rewardsEmissions: NonNullable<Asset["rewardsEmissions"]>, rewardId: AssetId) => {
            const rewardEmission = vaultRewardsEmissions[rewardId]
            if (bnOrZero(assetsData[vault.id].totalTvl).gt(0) && bnOrZero(assetsData[vault.id].tvlUsd).gt(0) && bnOrZero(assetsData[vault.id].aprRatio).gt(0)) {

              const totalTvl = bnOrZero(assetsData[vault.id].totalTvl)

              const vaultShare = totalTvl.div(rewardEmission.totalSupply)

              const annualDistributionWholePool = rewardEmission.annualDistribution.times(vaultShare)
              const annualDistributionWholePoolUsd = rewardEmission.annualDistributionUsd.times(vaultShare)

              const annualDistribution = annualDistributionWholePool.times(bnOrZero(assetsData[vault.id].aprRatio).div(100))
              const annualDistributionUsd = annualDistributionWholePoolUsd.times(bnOrZero(assetsData[vault.id].aprRatio).div(100))
              const annualDistributionOn1000Usd = annualDistribution.times(1000).div(bnOrZero(assetsData[vault.id].tvlUsd))

              const vaultRewardEmission: RewardEmission = {
                assetId: rewardId,
                annualDistribution,
                annualDistributionUsd,
                annualDistributionOn1000Usd
              }
              // Calculate apr using annual distribution usd
              if (BNify(vaultRewardEmission.annualDistributionUsd).gt(0)) {
                vaultRewardEmission.apr = BNify(vaultRewardEmission.annualDistributionUsd).div(bnOrZero(assetsData[vault.id].tvlUsd)).times(100)
              }

              rewardsEmissions[rewardId] = vaultRewardEmission
            }
            return rewardsEmissions
          }, {})
        }

        // Gearbox rewards
        if (!isEmpty(state.gearboxPointsEmissions[vault.cdoConfig.address])) {
          const vaultPointsEmissions = state.gearboxPointsEmissions[vault.cdoConfig.address]
          assetsData[vault.id].rewardsEmissions = Object.keys(vaultPointsEmissions).reduce((rewardsEmissions: NonNullable<Asset["rewardsEmissions"]>, rewardId: AssetId) => {
            const rewardEmission = vaultPointsEmissions[rewardId]
            if (bnOrZero(assetsData[vault.id].totalTvl).gt(0) && bnOrZero(assetsData[vault.id].tvlUsd).gt(0) && bnOrZero(assetsData[vault.id].aprRatio).gt(0)) {
              const trancheAprRatio = bnOrZero(assetsData[vault.id].aprRatio).div(bnOrZero(assetsData[vault.id].currentRatio))
              if (bnOrZero(rewardEmission.annualDistributionOn1000Usd).gt(0)) {
                rewardsEmissions[rewardId] = { ...rewardEmission }
                rewardsEmissions[rewardId].annualDistributionOn1000Usd = bnOrZero(rewardsEmissions[rewardId].annualDistributionOn1000Usd).times(trancheAprRatio)
              } else {
                const totalTvl = bnOrZero(assetsData[vault.id].totalTvl)
                const vaultShare = totalTvl.div(rewardEmission.totalSupply)
                const annualDistributionWholePool = rewardEmission.annualDistribution.times(vaultShare)
                const annualDistributionWholePoolUsd = rewardEmission.annualDistributionUsd.times(vaultShare)

                const annualDistribution = annualDistributionWholePool.times(trancheAprRatio)
                const annualDistributionUsd = annualDistributionWholePoolUsd.times(trancheAprRatio)
                const annualDistributionOn1000Usd = annualDistribution.times(1000).div(bnOrZero(assetsData[vault.id].tvlUsd))

                const vaultRewardEmission: RewardEmission = {
                  ...rewardEmission,
                  annualDistribution,
                  annualDistributionUsd,
                  annualDistributionOn1000Usd,
                }
                // Calculate apr using annual distribution usd
                if (BNify(vaultRewardEmission.annualDistributionUsd).gt(0)) {
                  vaultRewardEmission.apr = BNify(vaultRewardEmission.annualDistributionUsd).div(bnOrZero(assetsData[vault.id].tvlUsd)).times(100)
                }

                rewardsEmissions[rewardId] = vaultRewardEmission
              }
            }
            return rewardsEmissions
          }, {})
        }
      }

      const assetRewardsEmissions = assetsData[vault.id].rewardsEmissions || {}

      // Add custom rewards emissions
      const vaultRewardsEmissions = vaultFunctionsHelper.getVaultRewardsEmissions(vault, state.vaults, assetsData)
      if (vaultRewardsEmissions) {
        vaultRewardsEmissions.forEach((rewardEmission: RewardEmission) => {
          assetRewardsEmissions[rewardEmission.assetId] = rewardEmission
        })
      }


      assetsData[vault.id].rewardsEmissions = assetRewardsEmissions

      assetsData[vault.id].aprBreakdown = { ...state.aprsBreakdown[vault.id] } || {}

      // Add gauge to vault apr breakdown
      if (vault.type === 'GG' && ("trancheVault" in vault) && vault.enabled) {
        const trancheVault = vault.trancheVault
        if (trancheVault) {
          if (assetsData[vault.id].gaugeData?.rewards) {
            const gaugeRewards = assetsData[vault.id].gaugeData?.rewards || []
            const aprBreakdown = assetsData[trancheVault.id].aprBreakdown || {}
            aprBreakdown.gauge = (Object.values(gaugeRewards) as GaugeRewardData[])
              .reduce((total: BigNumber, rewardData: GaugeRewardData) => {
                if (!rewardData.apr) return total
                return total.plus(BNify(rewardData.apr))
              }, BNify(0))

            assetsData[trancheVault.id].aprBreakdown = aprBreakdown
          }
        }
      }

      // Add underlying protocols aprs
      if (("getFlag" in vault) && vault.getFlag("addUnderlyingProtocolsAdditionalApr") && assetsData[vault.id].interestBearingTokens) {
        const totalTvl = bnOrZero(assetsData[vault.id].totalTvl)
        const additionalAprs = Object.keys(assetsData[vault.id].interestBearingTokens as Balances).reduce((additionalAprs: Balances, underlyingVaultId: string) => {
          const underlyingVaultData = assetsData[underlyingVaultId]
          const underlyingVaultAllocation = bnOrZero(assetsData[vault.id]?.interestBearingTokens?.[underlyingVaultId])

          // Check vault allocation
          if (underlyingVaultAllocation.gt(0) && underlyingVaultData.aprBreakdown) {
            // Look for additional vaults apr
            Object.keys(underlyingVaultData.aprBreakdown as Balances).forEach((aprType: string) => {
              if (['rewards', 'harvest'].includes(aprType)) {
                if (!additionalAprs[aprType]) {
                  additionalAprs[aprType] = BNify(0)
                }
                const allocationPercentage = underlyingVaultAllocation.div(totalTvl)
                // console.log('addUnderlyingProtocolsAdditionalApr', vault.id, underlyingVaultId, underlyingVaultAllocation.toString(), allocationPercentage.toString(), aprType, bnOrZero(underlyingVaultData.aprBreakdown?.[aprType]).toString())
                // Multiply additional apr for allocation percentage
                additionalAprs[aprType] = additionalAprs[aprType].plus(bnOrZero(underlyingVaultData.aprBreakdown?.[aprType]).times(allocationPercentage))
              }
            })
          }
          return additionalAprs
        }, {})

        // Incorporate additional aprs to aprBreakdown
        if (!isEmpty(additionalAprs)) {
          // Initialize vault apr breakdown if not
          if (!assetsData[vault.id].aprBreakdown) {
            assetsData[vault.id].aprBreakdown = {}
          }
          Object.keys(additionalAprs).forEach(aprType => {
            if (!assetsData[vault.id].aprBreakdown?.[aprType]) {
              (assetsData[vault.id].aprBreakdown as Balances)[aprType] = BNify(0)
            }
            (assetsData[vault.id].aprBreakdown as Balances)[aprType] = bnOrZero(assetsData[vault.id].aprBreakdown?.[aprType]).plus(additionalAprs[aprType])
          })
        }
      }

      if (assetsData[vault.id].aprBreakdown) {
        const compoundAprFlag = ("getFlag" in vault) ? vault.getFlag('compoundApr') : undefined
        const compoundApr = compoundAprFlag !== undefined ? vault.getFlag('compoundApr') : true

        // Calculate APYs
        assetsData[vault.id].apyBreakdown = Object.keys(assetsData[vault.id].aprBreakdown || {}).reduce((apyBreakdown: Balances, type: string): Balances => {
          const apr = assetsData[vault.id].aprBreakdown?.[type]
          if (apr) {
            if (type !== 'rewards' && compoundApr) {
              apyBreakdown[type] = compoundVaultApr(apr, assetsData[vault.id].epochData?.epochDuration)
            } else {
              apyBreakdown[type] = apr
            }
          }
          return apyBreakdown
        }, {})
      }

      // Calculate APR and APY using the breakdowns (without additional rewards)
      assetsData[vault.id].apr = assetsData[vault.id].aprBreakdown ? (Object.values(assetsData[vault.id].aprBreakdown || {}) as BigNumber[]).reduce((total: BigNumber, apr: BigNumber) => total.plus(apr), BNify(0)) : BNify(0)
      assetsData[vault.id].apy = assetsData[vault.id].apyBreakdown ? (Object.values(assetsData[vault.id].apyBreakdown || {}) as BigNumber[]).reduce((total: BigNumber, apy: BigNumber) => total.plus(apy), BNify(0)) : BNify(0)

      const grossApr = bnOrZero(assetsData[vault.id].aprBreakdown?.base)
      assetsData[vault.id].netApr = grossApr.minus(grossApr.times(bnOrZero(assetsData[vault.id].fee)))
      assetsData[vault.id].netApy = compoundVaultApr(assetsData[vault.id].netApr as BigNumber, assetsData[vault.id].epochData?.epochDuration)

      // Add rewards on top
      const vaultRewardsEmissionsTotalApr: VaultAdditionalApr = vaultFunctionsHelper.getRewardsEmissionTotalApr(vault, assetsData[vault.id])
      if (vaultRewardsEmissionsTotalApr && bnOrZero(vaultRewardsEmissionsTotalApr.apr).gt(0)) {
        rewardsEmissionsTotalApr = rewardsEmissionsTotalApr.plus(vaultRewardsEmissionsTotalApr.apr)
      }

      // Add rewards emissions total apr
      if (rewardsEmissionsTotalApr.gt(0)) {
        if (!assetsData[vault.id].aprBreakdown?.rewards) {
          (assetsData[vault.id].aprBreakdown as Balances)['rewards'] = BNify(0)
        }
        (assetsData[vault.id].aprBreakdown as Balances)['rewards'] = (assetsData[vault.id].aprBreakdown as Balances)['rewards'].plus(rewardsEmissionsTotalApr);
        (assetsData[vault.id].apyBreakdown as Balances)['rewards'] = (assetsData[vault.id].aprBreakdown as Balances)['rewards']

        // Calculate APR and APY using the breakdowns (with additional rewards)
        assetsData[vault.id].apr = assetsData[vault.id].aprBreakdown ? (Object.values(assetsData[vault.id].aprBreakdown || {}) as BigNumber[]).reduce((total: BigNumber, apr: BigNumber) => total.plus(apr), BNify(0)) : BNify(0)
        assetsData[vault.id].apy = assetsData[vault.id].apyBreakdown ? (Object.values(assetsData[vault.id].apyBreakdown || {}) as BigNumber[]).reduce((total: BigNumber, apy: BigNumber) => total.plus(apy), BNify(0)) : BNify(0)
      }
    }

    dispatch({ type: 'SET_ASSETS_DATA', payload: assetsData })
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
    state.poolsData,
    state.totalAprs,
    state.openVaults,
    state.gaugesData,
    state.epochsData,
    state.balancesUsd,
    state.allocations,
    state.vaultsPrices,
    state.lastHarvests,
    state.pausedVaults,
    state.totalSupplies,
    state.vaultsRewards,
    state.currentRatios,
    state.aprsBreakdown,
    state.walletAllowed,
    state.protocolsAprs,
    state.additionalAprs,
    state.vaultsNetworks,
    state.discountedFees,
    state.vaultsRequests,
    vaultFunctionsHelper,
    state.historicalRates,
    state.vaultsPositions,
    state.historicalPrices,
    state.idleDistributions,
    state.distributedRewards,
    state.historicalPricesUsd,
    state.vaultsCollectedFees,
    state.interestBearingTokens,
    state.morphoRewardsEmissions,
    state.gearboxPointsEmissions
  ])

  useEffect(() => {
    if (!state.isPortfolioLoaded || isEmpty(state.assetsData)) return;
    const visibleAssets: Asset[] = (Object.values(state.assetsData) as Asset[]).filter((asset: Asset) => (!!strategies[asset.type as string]?.visible))
    const totalTvlUsd = Object.values(visibleAssets).reduce((totalTvlUsd: BigNumber, asset: Asset) => totalTvlUsd.plus(bnOrZero(asset?.tvlUsd)), BNify(0))
    const totalAvgApy = Object.values(visibleAssets).reduce((avgApy: BigNumber, asset: Asset) => avgApy.plus(bnOrZero(asset?.tvlUsd).times(BigNumber.minimum(9999, bnOrZero(asset?.netApy)))), BNify(0)).div(totalTvlUsd)
    const uniqueVaults: AssetId[] = visibleAssets.reduce((uniqueVaults: AssetId[], asset: Asset) => {
      const vault = selectVaultById(asset.id)
      if (asset.status !== 'deprecated' && vault) {
        if (vault instanceof TrancheVault) {
          const cdoAddress = vault.cdoConfig.address
          if (!uniqueVaults.includes(cdoAddress)) {
            uniqueVaults.push(cdoAddress)
          }
        } else {
          uniqueVaults.push(asset.id as string)
        }
      }
      return uniqueVaults
    }, [])

    const uniqueChains: number[] = uniqueVaults.reduce( (uniqueChains: number[], assetId: AssetId) => {
      const asset = selectVaultById(assetId)
      if (asset && !uniqueChains.includes(+asset.chainId)){
        return [
          ...uniqueChains,
          +asset.chainId
        ]
      }
      return uniqueChains
    }, [])

    dispatch({
      type: 'SET_PROTOCOL_DATA', payload: {
        totalTvlUsd,
        totalAvgApy,
        uniqueChains: uniqueChains.length,
        uniqueVaults: uniqueVaults.length
      }
    })
  }, [state.assetsData, selectVaultById, state.isPortfolioLoaded])

  return (
    <PortfolioProviderContext.Provider value={state}>
      {children}
    </PortfolioProviderContext.Provider>
  )
}
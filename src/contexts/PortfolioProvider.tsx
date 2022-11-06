import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { GaugeVault } from 'vaults/GaugeVault'
import useLocalForge from 'hooks/useLocalForge'
import { useWeb3Provider } from './Web3Provider'
import { TrancheVault } from 'vaults/TrancheVault'
import type { ProviderProps, } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { GenericContract } from 'contracts/GenericContract'
import type { CallData, DecodedResult } from 'classes/Multicall'
import { BNify, makeEtherscanApiRequest, apr2apy, isEmpty } from 'helpers/'
import type { GenericContractConfig, UnderlyingTokenProps } from 'constants/'
import React, { useContext, useEffect, useCallback, useReducer } from 'react'
import { VaultFunctionsHelper, ChainlinkHelper, FeedRoundBounds } from 'classes/'
import { globalContracts, bestYield, tranches, gauges, underlyingTokens, ContractRawCall } from 'constants/'
import type { Balances, Asset, AssetId, Assets, Vault, Transaction, VaultPosition, VaultAdditionalApr, VaultHistoricalData, HistoryData } from 'constants/types'

type InitialState = {
  aprs: Balances
  vaults: Vault[]
  balances: Balances
  assetsData: Assets
  pricesUsd: Balances
  balancesUsd: Balances
  vaultsPrices: Balances
  totalSupplies: Balances
  isPortfolioLoaded: boolean
  transactions: Transaction[]
  contracts: GenericContract[]
  selectors: Record<string, Function>
  vaultsPositions: Record<string, VaultPosition>
  historicalRates: Record<AssetId, HistoryData[]>
  historicalPrices: Record<AssetId, HistoryData[]>
  historicalPricesUsd: Record<AssetId, HistoryData[]>
}

type ContextProps = InitialState

type ActionTypes = {
  type: string,
  payload: any
}

const initialState: InitialState = {
  aprs: {},
  vaults: [],
  balances: {},
  selectors: {},
  contracts: [],
  pricesUsd: {},
  assetsData: {},
  balancesUsd: {},
  vaultsPrices: {},
  transactions: [],
  totalSupplies: {},
  vaultsPositions: {},
  historicalRates: {},
  historicalPrices: {},
  historicalPricesUsd: {},
  isPortfolioLoaded: false
}

const initialContextState = initialState

const reducer = (state: InitialState, action: ActionTypes) => {

  // console.log(action.type, action.payload)

  switch (action.type){
    case 'RESET_STATE':
      return {...initialState}
    case 'SET_PORTFOLIO_LOADED':
      return {...state, isPortfolioLoaded: action.payload}
    case 'SET_SELECTORS':
      return {...state, selectors: action.payload}
    case 'SET_CONTRACTS':
      return {...state, contracts: action.payload}
    case 'SET_TRANSACTIONS':
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
  const { web3, multiCall } = useWeb3Provider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { walletInitialized, connecting, account, chainId, explorer } = useWalletProvider()
  const [ storedHistoricalPricesUsd, setHistoricalPricesUsd ] = useLocalForge('historicalPricesUsd')

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

  // useEffect(() => {
  //   console.log('accountChanged', account, connecting, walletInitialized)
  // }, [account, connecting, walletInitialized])

  // Init underlying tokens and vaults contracts
  useEffect(() => {

    if (!web3 || !chainId) return

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
        const trancheVaultAA = new TrancheVault(web3, chainId, protocol, vaultConfig, gaugeConfig, 'AA')
        const trancheVaultBB = new TrancheVault(web3, chainId, protocol, vaultConfig, null, 'BB')
        vaultsContracts.push(trancheVaultAA)
        vaultsContracts.push(trancheVaultBB)
      })
      return vaultsContracts;
    }, [])

    // Init best yield vaults
    const bestYieldVaults = Object.keys(bestYield[chainId]).reduce( (vaultsContracts: BestYieldVault[], token) => {
      const tokenConfig = bestYield[chainId][token]
      const trancheVault = new BestYieldVault(web3, chainId, tokenConfig, 'BY')
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
    dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})

    // Cleanup
    return () => {
      // dispatch({type: 'SET_VAULTS', payload: []})
      // dispatch({type: 'SET_CONTRACTS', payload: []})
      const assetsData = generateAssetsData(allVaults)
      dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})
    };

  }, [web3, chainId])

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

  // Get user vaults positions
  useEffect(() => {
    if (!account?.address || !explorer || !state.isPortfolioLoaded || connecting) return

    ;(async () => {

      const startTimestamp = Date.now()

      const endpoint = `${explorer.endpoints[chainId]}?module=account&action=tokentx&address=${account.address}&startblock=0&endblock=latest&sort=asc`
      const etherscanTransactions = await makeEtherscanApiRequest(endpoint, explorer.keys)

      const vaultsTransactions = await state.vaults.reduce( async (txsPromise: Promise<Record<string, Transaction[]>>, vault: Vault): Promise<Record<string, Transaction[]>> => {
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

        const depositedAmount = transactions.reduce( (depositedAmount: BigNumber, transaction: Transaction) => {
          // console.log(assetId, transaction.action, transaction.underlyingAmount.toString(), transaction.idlePrice.toString())
          switch (transaction.action) {
            case 'deposit':
              if (!firstDepositTx) firstDepositTx = transaction
              depositedAmount = depositedAmount.plus(transaction.underlyingAmount)
            break;
            case 'redeem':
              depositedAmount = BigNumber.maximum(0, depositedAmount.minus(transaction.underlyingAmount))
              if (depositedAmount.lte(0)) firstDepositTx = null
            break;
            default:
            break;
          }

          return depositedAmount
        }, BNify(0))

        if (depositedAmount.lte(0)) return vaultsPositions

        let stakedAmount = BNify(0);
        const vaultPrice = selectVaultPrice(assetId)
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

        const redeemableAmount = vaultBalance.times(vaultPrice)
        const earningsAmount = redeemableAmount.minus(depositedAmount)
        const earningsPercentage = redeemableAmount.div(depositedAmount).minus(1)
        const avgBuyPrice = BigNumber.maximum(1, vaultPrice.div(earningsPercentage.plus(1)))

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
          avgBuyPrice,
          firstDepositTx,
          depositDuration,
          earningsPercentage
        }

        // const tokenPrice = await pricesCalls[0].call.call({}, parseInt(tx.blockNumber))

        // console.log(assetId, 'vaultPrice', vaultPrice.toString(), 'depositedAmount', depositedAmount.toString(), 'vaultBalance', vaultBalance.toString(), 'redeemableAmount', redeemableAmount.toString(), 'earningsAmount', earningsAmount.toString(), 'earningsPercentage', earningsPercentage.toString(), 'avgBuyPrice', avgBuyPrice.toString())

        return vaultsPositions

      }, {})

      // Set asset data with vault position
      Object.keys(vaultsPositions).forEach( (assetId: AssetId) => {
        const vaultPosition = vaultsPositions[assetId]
        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { vaultPosition } }})
      })

      // console.log('vaultsPositions', account, vaultsPositions)
      // console.log('vaultsTransactions', account, vaultsTransactions)

      dispatch({type: 'SET_TRANSACTIONS', payload: vaultsTransactions})
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions})

      console.log('VAULTS POSITIONS LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()

    // Clean transactions and positions
    return () => {
      dispatch({type: 'SET_TRANSACTIONS', payload: []})
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: {}})
    };
  // eslint-disable-next-line
  }, [account, chainId, explorer, selectVaultPrice, selectAssetBalance, selectVaultGauge, selectAssetPriceUsd, state.isPortfolioLoaded])

  // Get historical underlying prices from chainlink
  useEffect(() => {

    if (isEmpty(state.vaults) || !web3 || !multiCall || connecting) return

    // Prices are already stored
    if (storedHistoricalPricesUsd){
      return dispatch({type: 'SET_HISTORICAL_PRICES_USD', payload: storedHistoricalPricesUsd})
    }

    // Get Historical data
    ;(async () => {

      const chainlinkHelper: ChainlinkHelper = new ChainlinkHelper(chainId, web3, multiCall)

      // Get assets chainlink feeds
      const vaultsUnderlyingTokens = state.vaults.reduce( ( assets: Record<AssetId, UnderlyingTokenProps>, vault: Vault): Record<AssetId, UnderlyingTokenProps> => {
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
        const feedAddress = callResult.data || underlyingToken.chainLinkPriceFeedUsd
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

        const rawCalls = chainlinkHelper.getHistoricalPricesRawCalls(assetId, feedUsdAddress, feedUsdRoundBounds)
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

      // console.log('historicalPricesUsd', historicalPricesUsd)

      Object.keys(historicalPricesUsd).forEach( (assetId: AssetId) => {
        const pricesUsd = historicalPricesUsd[assetId]
        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { pricesUsd } }})
      })

      setHistoricalPricesUsd(historicalPricesUsd)
      dispatch({type: 'SET_HISTORICAL_PRICES_USD', payload: historicalPricesUsd})

    })()
  // eslint-disable-next-line
  }, [state.vaults, web3, multiCall, chainId])
  
  // Get historical vaults data
  useEffect(() => {

    if (isEmpty(state.vaults) || !state.isPortfolioLoaded || !walletInitialized || connecting) return

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
  }, [state.vaults, state.isPortfolioLoaded, walletInitialized, connecting])

  // Get tokens prices, balances, rates
  useEffect(() => {

    if (!state.vaults.length || !state.contracts.length || !web3 || !multiCall || !explorer || connecting) return

    const vaultFunctionsHelper: VaultFunctionsHelper = new VaultFunctionsHelper(chainId, web3, multiCall, explorer)

    // console.log('Make chain calls', account, state.vaults, state.contracts, multiCall, walletInitialized)

    const rawCalls = state.vaults.reduce( (rawCalls: CallData[][], vault: Vault): CallData[][] => {

      const aggregatedRawCalls = [
        account ? vault.getBalancesCalls([account.address]) : [],
        ("getPricesCalls" in vault) ? vault.getPricesCalls() : [],
        ("getPricesUsdCalls" in vault) ? vault.getPricesUsdCalls(state.contracts) : [],
        ("getAprsCalls" in vault) ? vault.getAprsCalls() : [],
        ("getTotalSupplyCalls" in vault) ? vault.getTotalSupplyCalls() : [],
        ("getFeesCalls" in vault) ? vault.getFeesCalls() : [],
        ("getAprRatioCalls" in vault) ? vault.getAprRatioCalls() : [],
        ("getBaseAprCalls" in vault) ? vault.getBaseAprCalls() : [],
        ("getProtocolsCalls" in vault) ? vault.getProtocolsCalls() : []
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

    // Execute promises with multicall
    ;(async () => {

      const startTimestamp = Date.now();

      // Get vaults additional APRs
      const vaultsAdditionalAprsPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
        promises.push(vaultFunctionsHelper.getVaultAdditionalApr(vault))
        return promises
      }, [])

      // Get vaults additional base APRs
      const vaultsAdditionalBaseAprsPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
        promises.push(vaultFunctionsHelper.getVaultAdditionalBaseApr(vault))
        return promises
      }, [])

      const [
        vaultsAdditionalAprs,
        vaultsAdditionalBaseAprs,
        [
          balanceCallsResults,
          vaultsPricesCallsResults,
          pricesUsdCallsResults,
          aprsCallsResults,
          totalSupplyCallsResults,
          feesCallsResults,
          aprRatioResults,
          baseAprResults,
          protocolsResults
        ]
      ] = await Promise.all([
        Promise.all(vaultsAdditionalAprsPromises),
        Promise.all(vaultsAdditionalBaseAprsPromises),
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
      const allocations: Record<AssetId, Balances> = {}
      allocationsResults?.forEach( (callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const vault = selectVaultById(assetId)
          if (vault && ("tokenConfig" in vault) && ("protocols" in vault.tokenConfig)){
            const protocolAddress = callResult.extraData.data.protocolAddress
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
        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { allocations: allocations[assetId] } }})
      })

      // Process Apr Ratio
      aprRatioResults.forEach( (callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset){
            const trancheAPRSplitRatio = BNify(callResult.data.toString()).div(`1e03`)
            const aprRatio = asset.type === 'AA' ? trancheAPRSplitRatio : BNify(100).minus(trancheAPRSplitRatio)
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { aprRatio } }})
          }
        }
      })

      // Process Strategy Aprs
      baseAprResults.forEach( (callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset){
            let baseApr = BNify(callResult.data.toString()).div(`1e18`)

            // Add additional Apr
            const vaultAdditionalBaseApr: VaultAdditionalApr = vaultsAdditionalBaseAprs.find( (apr: VaultAdditionalApr) => apr.vaultId === assetId )
            if (vaultAdditionalBaseApr){
              baseApr = baseApr.plus(vaultAdditionalBaseApr.apr)
            }

            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { baseApr } }})
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
            // assetsData[assetId] = {
            //   ...assetsData[assetId],
            //   fee
            // }
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: { fee } }})
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
            // assetsData[assetId] = {
            //   ...assetsData[assetId],
            //   balance: balances[assetId]
            // }
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {balance: balances[assetId]} }})
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
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {vaultPrice: vaultsPrices[assetId]} }})
          }
        }
        return vaultsPrices
      }, {})

      const pricesUsd = pricesUsdCallsResults.reduce( (pricesUsd: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset){
            pricesUsd[assetId] = callResult.extraData.params.processResults(callResult.data, callResult.extraData.params)
            // console.log(`Asset Price Usd ${asset.name}: ${pricesUsd[assetId].toString()}`)
            // assetsData[assetId] = {
            //   ...assetsData[assetId],
            //   priceUsd: pricesUsd[assetId]
            // }
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {priceUsd: pricesUsd[assetId]} }})
          }
        }
        return pricesUsd
      }, {})

      const aprs = aprsCallsResults.reduce( (aprs: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset){
            const decimals = callResult.extraData.decimals || 18
            aprs[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)

            // Add additional Apr
            const vaultAdditionalApr: VaultAdditionalApr = vaultsAdditionalAprs.find( (apr: VaultAdditionalApr) => apr.vaultId === assetId )
            if (vaultAdditionalApr){
              aprs[assetId] = aprs[assetId].plus(vaultAdditionalApr.apr.div(`1e${decimals}`))
            }

            const apy = apr2apy(aprs[assetId].div(100)).times(100)

            // console.log(`Apr ${asset.name}: ${aprs[assetId].toString()}`)
            // assetsData[assetId] = {
            //   ...assetsData[assetId],
            //   priceUsd: pricesUsd[assetId],
            //   apr: aprs[assetId],
            //   apy
            // }
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {apr: aprs[assetId], apy} }})
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
            // assetsData[assetId] = {
            //   ...assetsData[assetId],
            //   priceUsd: pricesUsd[assetId],
            //   totalSupply: totalSupplies[assetId]
            // }
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {totalSupply: totalSupplies[assetId]} }})
          }
        }
        return totalSupplies
      }, {})

      // console.log('assetsData', assetsData)
      // Set assets data one time instead of updating for every asset
      // dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})

      // console.log('aprs', aprs)
      // console.log('balances', balances)
      // console.log('pricesUsd', pricesUsd)
      // console.log('vaultsPrices', vaultsPrices)
      // console.log('totalSupplies', totalSupplies)

      dispatch({type: 'SET_APRS', payload: aprs})
      dispatch({type: 'SET_BALANCES', payload: balances})
      dispatch({type: 'SET_PRICES_USD', payload: pricesUsd})
      dispatch({type: 'SET_VAULTS_PRICES', payload: vaultsPrices})
      dispatch({type: 'SET_TOTAL_SUPPLIES', payload: totalSupplies})
      dispatch({type: 'SET_PORTFOLIO_LOADED', payload: true})

      console.log('PORTFOLIO LOADED in ', (Date.now()-startTimestamp)/1000, 'seconds')
    })()

    // Cleanup
    return () => {
      dispatch({type: 'SET_APRS', payload: {}})
      dispatch({type: 'SET_BALANCES', payload: {}})
      dispatch({type: 'SET_PRICES_USD', payload: {}})
      dispatch({type: 'SET_VAULTS_PRICES', payload: {}})
      dispatch({type: 'SET_TOTAL_SUPPLIES', payload: {}})
      dispatch({type: 'SET_PORTFOLIO_LOADED', payload: false})
    };
  // eslint-disable-next-line
  }, [account, state.vaults, state.contracts, web3, explorer, multiCall, walletInitialized])
  
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
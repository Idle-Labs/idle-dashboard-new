import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { GaugeVault } from 'vaults/GaugeVault'
import { useWeb3Provider } from './Web3Provider'
import { TrancheVault } from 'vaults/TrancheVault'
import type { ProviderProps, } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { BestYieldVault } from 'vaults/BestYieldVault'
import type { GenericContractConfig } from 'constants/'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { BNify, makeEtherscanApiRequest } from 'helpers/'
import { GenericContract } from 'contracts/GenericContract'
import type { CallData, DecodedResult } from 'classes/Multicall'
import { VaultFunctionsHelper } from 'classes/VaultFunctionsHelper'
import React, { useContext, useEffect, useCallback, useReducer } from 'react'
import { globalContracts, bestYield, tranches, gauges, underlyingTokens, ContractRawCall } from 'constants/'
import type { Balances, Asset, AssetId, Assets, Vault, Transaction, VaultPosition, VaultAdditionalApr, VaultHistoricalRates, HistoryData } from 'constants/types'

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
  rates: Record<AssetId, HistoryData[]>
  vaultsPositions: Record<string, VaultPosition>
}

type ContextProps = InitialState

type ActionTypes = {
  type: string,
  payload: any
}

const initialState: InitialState = {
  aprs: {},
  rates: {},
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
  isPortfolioLoaded:false
}

const initialContextState = initialState

const reducer = (state: InitialState, action: ActionTypes) => {

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
    case 'SET_RATES':
      return {...state, rates: action.payload}
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
  const { walletInitialized, account, chainId, explorer } = useWalletProvider()

  const generateAssetsData = (vaults: Vault[]) => {
    const assetData = vaults.reduce( (assets: Assets, vault: Vault) => {
      const vaultAssetsData = vault.getAssetsData()

      // Add assets IDs
      const vaultAssetsDataWithIds = Object.keys(vaultAssetsData).reduce( (vaultAssetsDataWithIds: Assets, assetId: AssetId) => {
        vaultAssetsDataWithIds[assetId] = {
          id: assetId,
          ...vaultAssetsData[assetId]
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

  const selectAssetsByIds = useCallback( (assetIds: AssetId[]): Asset[] | null => {
    const assetIdsLowerCase = assetIds.map( assetId => assetId.toLowerCase() )
    return Object.keys(state.assetsData).filter( assetId => assetIdsLowerCase.includes(assetId) ).map( assetId => state.assetsData[assetId] )
  }, [state.assetsData])

  const selectVaultsAssetsByType = useCallback( (vaultType: string): Asset[] | null => {
    const vaults = state.vaults ? state.vaults.filter( (vault: Vault) => vault.type.toLowerCase() === vaultType.toLowerCase()) || null : null
    return Object.keys(state.assetsData).filter( assetId => vaults.map( (vault: Vault) => vault.id.toLowerCase() ).includes(assetId) ).map( assetId => state.assetsData[assetId] )
  }, [state.vaults, state.assetsData])

  const selectVaultsAssetsWithBalance = useCallback( (vaultType: string | null = null, includeStakedAmount: boolean = true): Asset[] | null => {
    const vaultsWithBalance = state.vaults ? state.vaults.filter( (vault: Vault) => {
      const asset = selectAssetById(vault.id)
      const checkVaultType = !vaultType || vault.type.toLowerCase() === vaultType.toLowerCase()
      const vaultHasBalance = BNify(asset?.balance).gt(0)
      const vaultHasStakedBalance = includeStakedAmount && BNify(asset?.vaultPosition?.underlying.staked).gt(0)
      return checkVaultType && (vaultHasBalance || vaultHasStakedBalance)
    }) : null
    return Object.keys(state.assetsData).filter( (assetId: AssetId) => vaultsWithBalance.map( (vault: Vault) => vault.id.toLowerCase() ).includes(assetId) ).map( (assetId: AssetId) => state.assetsData[assetId] )
  }, [state.vaults, state.assetsData, selectAssetById])

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

  // Init underlying tokens and vaults contracts
  useEffect(() => {
    if (!web3) return

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
      dispatch({type: 'RESET_STATE', payload: {}})
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
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectVaultsAssetsWithBalance
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
    selectVaultsWithBalance,
    selectVaultsAssetsByType,
    selectVaultsAssetsWithBalance
  ])

  useEffect(() => {
    if (!account?.address || !explorer || !state.isPortfolioLoaded) return
    ;(async () => {
      const endpoint = `${explorer.endpoints[chainId]}?module=account&action=tokentx&address=${account.address}&startblock=0&endblock=latest&sort=asc`
      const etherscanTransactions = await makeEtherscanApiRequest(endpoint, explorer.keys)

      // console.log('etherscanTransactions', etherscanTransactions)

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

        const depositedAmount = transactions.reduce( (depositedAmount: BigNumber, transaction: Transaction) => {
          // console.log(assetId, transaction.action, transaction.underlyingAmount.toString(), transaction.idlePrice.toString())
          switch (transaction.action) {
            case 'deposit':
              depositedAmount = depositedAmount.plus(transaction.underlyingAmount)
            break;
            case 'redeem':
              depositedAmount = BigNumber.maximum(0, depositedAmount.minus(transaction.underlyingAmount))
            break;
            default:
            break;
          }

          return depositedAmount
        }, BNify(0))

        if (depositedAmount.lte(0)) return vaultsPositions

        let stakedAmount = BNify(0);
        // const vault = selectVaultById(assetId)
        // const asset = selectAssetById(assetId)
        const vaultPrice = selectVaultPrice(assetId)
        const assetPriceUsd = selectAssetPriceUsd(assetId)
        let vaultBalance = selectAssetBalance(assetId)

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
          earningsPercentage,
        }

        // console.log(assetId, 'vaultPrice', vaultPrice.toString(), 'depositedAmount', depositedAmount.toString(), 'vaultBalance', vaultBalance.toString(), 'redeemableAmount', redeemableAmount.toString(), 'earningsAmount', earningsAmount.toString(), 'earningsPercentage', earningsPercentage.toString(), 'avgBuyPrice', avgBuyPrice.toString())

        return vaultsPositions

      }, {})

      // Set asset data with vault position
      Object.keys(vaultsPositions).forEach( (assetId: AssetId) => {
        const vaultPosition = vaultsPositions[assetId]
        dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {vaultPosition} }})
      })

      // console.log('vaultsPositions', vaultsPositions)
      // console.log('vaultsTransactions', vaultsTransactions)

      dispatch({type: 'SET_TRANSACTIONS', payload: vaultsTransactions})
      dispatch({type: 'SET_VAULTS_POSITIONS', payload: vaultsPositions})
    })()

    // Clean transactions and positions
    return () => {
      dispatch({type: 'RESET_STATE', payload: {}})
    };
  // eslint-disable-next-line
  }, [account, chainId, explorer, selectVaultPrice, selectAssetBalance, selectVaultGauge, selectAssetPriceUsd, state.isPortfolioLoaded])
  
  // Get historical vaults data
  useEffect(() => {
    if (!state.vaults.length || !state.isPortfolioLoaded) return

    // Execute promises with multicall
    ;(async () => {
      // Get vaults historical Rates
      const historicalAprsFilters = {
        // frequency:86400,
        start: dayjs().subtract(7, 'days').unix()
      }

      const vaultsHistoricalAprsPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
        promises.push(vault.getHistoricalAprs(historicalAprsFilters))
        return promises
      }, [])

      const vaultsHistoricalAprs = await Promise.all(vaultsHistoricalAprsPromises)

      const rates: Record<AssetId, HistoryData[]> = {}
      vaultsHistoricalAprs.forEach( (vaultHistoricalRate: VaultHistoricalRates) => {
        const assetId = vaultHistoricalRate.vaultId
        const asset = selectAssetById(assetId)
        if (asset){
          rates[assetId] = vaultHistoricalRate.rates
          dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {rates: rates[assetId]} }})
        }
      })

      dispatch({type: 'SET_RATES', payload: rates})
    })()

  // eslint-disable-next-line
  }, [state.vaults, state.isPortfolioLoaded])

  // Get tokens prices, balances, rates
  useEffect(() => {

    if (!state.vaults.length || !state.contracts.length || !web3 || !multiCall || !explorer) return

    const vaultFunctionsHelper: VaultFunctionsHelper = new VaultFunctionsHelper(chainId, web3, multiCall, explorer)

    // console.log('Make chain calls', account, state.vaults, state.contracts, multiCall, walletInitialized)

    const rawCalls = state.vaults.reduce( (rawCalls: CallData[][], vault: Vault): CallData[][] => {

      const aggregatedRawCalls = [
        account ? vault.getBalancesCalls([account.address]) : [],
        vault.getPricesCalls(),
        vault.getPricesUsdCalls(state.contracts),
        vault.getAprsCalls(),
        vault.getTotalSupplyCalls()
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

    // ;(async () => {
    //   // Get vaults historical Rates
    //   const historicalAprsFilters = {
    //     // frequency:86400,
    //     start: dayjs().subtract(7, 'days').unix()
    //   }

    //   const vaultsHistoricalAprsPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
    //     promises.push(vault.getHistoricalAprs(historicalAprsFilters))
    //     return promises
    //   }, [])

    //   const vaultsHistoricalAprs = await Promise.all(vaultsHistoricalAprsPromises)

    //   const rates = vaultsHistoricalAprs.reduce( (rates: Record<AssetId, HistoryData[]>, vaultHistoricalRate: VaultHistoricalRates) => {
    //     const assetId = vaultHistoricalRate.vaultId
    //     const asset = selectAssetById(assetId)
    //     if (asset){
    //       rates[assetId] = vaultHistoricalRate.rates
    //       dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {rates: rates[assetId]} }})
    //     }
    //     return rates
    //   })

    //   console.log('SET_RATES', rates)
    //   dispatch({type: 'SET_RATES', payload: rates})
    // })()

    // Execute promises with multicall
    ;(async () => {

      // Get vaults additional APRs
      const vaultsAdditionalAprsPromises = state.vaults.reduce( (promises: Promise<any>[], vault: Vault): Promise<any>[] => {
        promises.push(vaultFunctionsHelper.getVaultAdditionalApr(vault))
        return promises
      }, [])

      const vaultsAdditionalAprs = await Promise.all(vaultsAdditionalAprsPromises)

      const [
        balanceCallsResults,
        vaultsPricesCallsResults,
        pricesUsdCallsResults,
        aprsCallsResults,
        totalSupplyCallsResults
      ] = await multiCall.executeMultipleBatches(rawCalls)

      // console.log('pricesCallsResults', pricesCallsResults)
      // console.log('pricesUsdCallsResults', pricesUsdCallsResults)
      // console.log('balanceCallsResults', balanceCallsResults)
      // console.log('totalSupplyCallsResults', totalSupplyCallsResults)

      const balances = balanceCallsResults.reduce( (balances: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetById(assetId)
          if (asset){
            balances[assetId] = BNify(callResult.data.toString()).div(`1e${asset.decimals}`)
            // console.log(`Balance ${asset.name}: ${balances[assetId].toString()}`)
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

            // console.log(`Apr ${asset.name}: ${aprs[assetId].toString()}`)
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {apr: aprs[assetId]} }})
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
            dispatch({type: 'SET_ASSET_DATA', payload: { assetId, assetData: {totalSupply: totalSupplies[assetId]} }})
          }
        }
        return totalSupplies
      }, {})

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
    })()

    // Cleanup
    return () => {
      dispatch({type: 'RESET_STATE', payload: {}})
    };
  // eslint-disable-next-line
  }, [account, state.vaults, state.contracts, web3, explorer, multiCall, walletInitialized])

  useEffect(() => {

    if (!Object.values(state.balances).length || !Object.values(state.vaultsPositions).length) return

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

    // Cleanup
    return () => {
      dispatch({type: 'SET_BALANCES_USD', payload: {}})
    };

  // eslint-disable-next-line
  }, [state.balances, state.vaultsPositions, selectVaultPosition, selectAssetPriceUsd, selectAssetBalance, selectVaultPrice])

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
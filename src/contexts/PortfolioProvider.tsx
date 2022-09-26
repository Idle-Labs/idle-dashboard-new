import { BNify } from '../helpers'
import BigNumber from 'bignumber.js'
import { useWeb3Provider } from './Web3Provider'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { GaugeVault } from '../vaults/GaugeVault'
import { TrancheVault } from '../vaults/TrancheVault'
import { BestYieldVault } from '../vaults/BestYieldVault'
import type { GenericContractConfig } from '../constants'
import { UnderlyingToken } from '../vaults/UnderlyingToken'
import { GenericContract } from '../contracts/GenericContract'
import type { CallData, DecodedResult } from '../classes/Multicall'
import type { Balances, Asset, Assets, Vault } from '../constants/types'
import React, { useContext, useEffect, useCallback, useReducer } from 'react'
import { globalContracts, bestYield, tranches, gauges, underlyingTokens } from '../constants'

type InitialState = {
  aprs: Balances
  vaults: Vault[]
  balances: Balances
  assetsData: Assets
  pricesUsd: Balances
  balancesUsd: Balances
  vaultsPrices: Balances
  totalSupplies: Balances
  contracts: GenericContract[]
}

type ContextProps = {
  // underlyingBalances: Balances
  state: InitialState
}

type ActionTypes = {
  type: string,
  payload: any
}

const initialState: InitialState = {
  aprs: {},
  vaults: [],
  balances: {},
  contracts: [],
  pricesUsd: {},
  assetsData: {},
  balancesUsd: {},
  vaultsPrices: {},
  totalSupplies: {}
}

const initialContextState = {
  state:initialState
}

const reducer = (state: InitialState, action: ActionTypes) => {
  switch (action.type){
    case 'SET_CONTRACTS':
      return {...state, contracts: action.payload}
    case 'SET_VAULTS':
      return {...state, vaults: action.payload}
    case 'SET_APRS':
      return {...state, aprs: action.payload}
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
      return {...state, assetsData: {
        ...state.assetsData,
        [action.payload.assetId.toLowerCase()]:{
          ...state.assetsData[action.payload.assetId.toLowerCase()],
          ...action.payload.assetData
        }
      }}
    default:
      return state
  }
}

const PortfolioProviderContext = React.createContext<ContextProps>(initialContextState)

export const usePortfolioProvider = () => useContext(PortfolioProviderContext)

export function PortfolioProvider({ children }:ProviderProps) {
  const { web3, multiCall } = useWeb3Provider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { walletInitialized, account, chainId } = useWalletProvider()

  const generateAssetsData = (vaults: Vault[]) => {
    return vaults.reduce( (assets: Assets, vault: Vault) => {
      const vaultAssetsData = vault.getAssetsData()
      return {...assets, ...vaultAssetsData}
    },{})
  }

  const getVault = useCallback( (vaultId: string): Vault | null => {
    return state.vaults ? state.vaults.find( (vault: Vault) => vault.id.toLowerCase() === vaultId.toLowerCase()) || null : null
  }, [state.vaults])

  const selectAssetById = useCallback( (assetId: string | undefined): Asset | null => {
    return assetId && state.assetsData ? state.assetsData[assetId.toLowerCase()] : null
  }, [state.assetsData])

  const selectVaultPrice = useCallback( (assetId: string | undefined): BigNumber => {
    if (!state.vaultsPrices || !assetId) return BNify(1)
    return state.vaultsPrices[assetId.toLowerCase()] || BNify(1)
  }, [state.vaultsPrices])

  const selectAssetPriceUsd = useCallback( (assetId: string | undefined): BigNumber => {
    if (!state.pricesUsd || !assetId) return BNify(1)
    return state.pricesUsd[assetId.toLowerCase()] || BNify(1)
  }, [state.pricesUsd])

  const selectAssetBalance = useCallback( (assetId: string | undefined): BigNumber => {
    if (!state.balances || !assetId) return BNify(0)
    return state.balances[assetId.toLowerCase()] || BNify(0)
  }, [state.balances])

  const selectAssetBalanceUsd = useCallback( (assetId: string | undefined): BigNumber => {
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
        const trancheVault = new TrancheVault(web3, chainId, protocol, vaultConfig)
        vaultsContracts.push(trancheVault)
      })
      return vaultsContracts;
    }, [])

    // Init best yield vaults
    const bestYieldVaults = Object.keys(bestYield[chainId]).reduce( (vaultsContracts: BestYieldVault[], token) => {
      const tokenConfig = bestYield[chainId][token]
      const trancheVault = new BestYieldVault(web3, chainId, tokenConfig)
      vaultsContracts.push(trancheVault)
      return vaultsContracts;
    }, [])

    // Init gauges vaults
    const gaugesVaults = Object.keys(gauges).reduce( (vaultsContracts: GaugeVault[], token) => {
      const gaugeConfig = gauges[token]
      const trancheVault = trancheVaults.find( tranche => tranche.trancheAAConfig.address.toLowerCase() === gaugeConfig.trancheToken.address.toLowerCase() )

      const gaugeVault = new GaugeVault(web3, chainId, gaugeConfig, trancheVault)
      vaultsContracts.push(gaugeVault)
      return vaultsContracts;
    }, [])

    const allVaults = [...underlyingTokensVaults, ...trancheVaults, ...bestYieldVaults, ...gaugesVaults]
    
    const assetsData = generateAssetsData(allVaults)

    dispatch({type: 'SET_VAULTS', payload: allVaults})
    dispatch({type: 'SET_CONTRACTS', payload: contracts})
    dispatch({type: 'SET_ASSETS_DATA', payload: assetsData})

  }, [web3, chainId])

  useEffect(() => {
    console.log('assetsData', state.assetsData)
  }, [state.assetsData])

  // Get tokens prices, balances, rates
  useEffect(() => {
    if (!state.vaults || !state.contracts || !multiCall) return

    const rawCalls = state.vaults.reduce( (rawCalls: CallData[][], vault: Vault): CallData[][] => {

      const aggregatedRawCalls = [
        account ? vault.getBalancesCalls([account.address]) : [],
        vault.getPricesCalls(),
        vault.getPricesUsdCalls(state.contracts),
        vault.getAprsCalls(),
        vault.getTotalSupplyCalls()
      ]

      aggregatedRawCalls.forEach( (calls: any[], index: number) => {
        // Init array index
        if (rawCalls.length<=index){
          rawCalls.push([])
        }

        calls.forEach( rawCall => {
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
      const [
        balanceCallsResults,
        vaultsPricesCallsResults,
        pricesUsdCallsResults,
        aprsCallsResults,
        totalSupplyCallsResults
      ] = await multiCall.executeMultipleBatches(rawCalls)

      // const batchedResults = await multiCall.executeMultipleBatches(rawCalls)

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
            console.log(`Balance ${asset.name}: ${balances[assetId].toString()}`)
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
            console.log(`Vault Price ${asset.name} ${decimals}: ${vaultsPrices[assetId].toString()}`)
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
            console.log(`Asset Price Usd ${asset.name}: ${pricesUsd[assetId].toString()}`)
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
            console.log(`Apr ${asset.name}: ${aprs[assetId].toString()}`)
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
            console.log(`Total Supply ${asset.name} ${assetId}: ${totalSupplies[assetId].toString()} ${decimals}`)
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
    })()
  // eslint-disable-next-line
  }, [account, state.vaults, state.contracts, multiCall, walletInitialized])

  useEffect(() => {
    let totalBalanceUsd = BNify(0);
    const balancesUsd = Object.keys(state.balances).reduce( (balancesUsd: Balances, assetId) => {
      const asset = selectAssetById(assetId)
      if (asset) {
        const vaultPrice = selectVaultPrice(assetId)
        const assetBalance = selectAssetBalance(assetId)
        const assetPriceUsd = selectAssetPriceUsd(assetId)

        balancesUsd[assetId] = assetBalance.times(vaultPrice).times(assetPriceUsd)//.times(underlyingTokenPrice)
        console.log(`Balance USD ${asset.name}: ${assetBalance.toString()}, ${vaultPrice.toString()}, ${assetPriceUsd.toString()} ${balancesUsd[assetId].toString()}`)

        totalBalanceUsd = totalBalanceUsd.plus(balancesUsd[assetId])
      }
      return balancesUsd
    }, {})

    console.log('totalBalanceUsd', totalBalanceUsd.toString())
    dispatch({type: 'SET_BALANCES_USD', payload: balancesUsd})

  }, [state.balances, state.vaultsPrices, state.pricesUsd, selectAssetBalance, selectAssetById, selectAssetPriceUsd, selectVaultPrice])

  return (
    <PortfolioProviderContext.Provider value={{state}}>
      {children}
    </PortfolioProviderContext.Provider>
  )
}
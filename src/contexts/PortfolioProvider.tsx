import { BNify } from '../helpers'
import BigNumber from 'bignumber.js'
import { useWeb3Provider } from './Web3Provider'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import { TrancheVault } from '../vaults/TrancheVault'
import type { GenericContractConfig } from '../constants'
import { UnderlyingToken } from '../vaults/UnderlyingToken'
import { GenericContract } from '../contracts/GenericContract'
import type { CallData, DecodedResult } from '../classes/Multicall'
import type { Balances, Asset, Assets, Vault } from '../constants/types'
import { globalContracts, tranches, underlyingTokens } from '../constants'
import React, { useContext, useState, useEffect, useCallback } from 'react'

type ContextProps = {
  // underlyingBalances: Balances
  balances: Balances
}

const initialState: ContextProps = {
  // underlyingBalances:{},
  balances:{}
}

const PortfolioProviderContext = React.createContext<ContextProps>(initialState)

export const usePortfolioProvider = () => useContext(PortfolioProviderContext)

export function PortfolioProvider({ children }:ProviderProps) {
  const { web3, multiCall } = useWeb3Provider()
  const { wallet, walletInitialized, account, chainId } = useWalletProvider()
  // const [ underlyingBalances, setUnderlyingBalances ] = useState<Balances>({})
  const [ balances, setBalances ] = useState<Balances>({})
  const [ balancesUsd, setBalancesUsd ] = useState<Balances>({})
  const [ vaultsPrices, setVaultsPrices ] = useState<Balances>({})
  const [ pricesUsd, setPricesUsd ] = useState<Balances>({})
  const [ assetsData, setAssetsData ] = useState<Assets | null>(null)
  const [ vaults, setVaults ] = useState<Vault[]>([])
  const [ contracts, setContracts ] = useState<GenericContract[]>([])

  const generateAssetsData = useCallback( (vaults: Vault[]) => {
    return vaults.reduce( (assets: Assets, vault: Vault) => {
      const vaultAssetsData = vault.getAssetsData()
      return {...assets, ...vaultAssetsData}
    },{})
  }, [])

  const getVault = useCallback( (vaultId: string): Vault | null => {
    return vaults ? vaults.find( vault => vault.id.toLowerCase() === vaultId.toLowerCase()) || null : null
  }, [vaults])

  const selectAssetByAddress = useCallback( (assetId: string | undefined): Asset | null => {
    return assetId && assetsData ? assetsData[assetId.toLowerCase()] : null
  }, [assetsData])

  const selectVaultPrice = useCallback( (assetId: string | undefined): BigNumber => {
    if (!vaultsPrices || !assetId) return BNify(1)
    return vaultsPrices[assetId.toLowerCase()] || BNify(1)
  }, [vaultsPrices])

  const selectAssetPriceUsd = useCallback( (assetId: string | undefined): BigNumber => {
    if (!pricesUsd || !assetId) return BNify(1)
    return pricesUsd[assetId.toLowerCase()] || BNify(1)
  }, [pricesUsd])

  const selectAssetBalance = useCallback( (assetId: string | undefined): BigNumber => {
    if (!balances || !assetId) return BNify(0)
    return balances[assetId.toLowerCase()] || BNify(0)
  }, [balances])

  const selectAssetBalanceUsd = useCallback( (assetId: string | undefined): BigNumber => {
    if (!balancesUsd || !assetId) return BNify(0)
    return balancesUsd[assetId.toLowerCase()] || BNify(0)
  }, [balancesUsd])

  // Init underlying tokens and vaults contracts
  useEffect(() => {
    if (!web3) return

    // Init global contracts
    const contracts = globalContracts[chainId].map( (contract: GenericContractConfig) => {
      return new GenericContract(web3, chainId, contract)
    })

    // Init underlying tokens contracts
    const underlyingTokensVaults = Object.keys(underlyingTokens[chainId]).reduce( ( vaultsContracts: UnderlyingToken[], token) => {
      const tokenConfig = underlyingTokens[chainId][token]
      if (tokenConfig.address) {
        const underlyingToken = new UnderlyingToken(web3, chainId, tokenConfig)
        vaultsContracts.push(underlyingToken)
      }
      return vaultsContracts;
    }, [])

    // Init tranches contracts
    const trancheVaults = Object.keys(tranches[chainId]).reduce( (vaultsContracts: TrancheVault[], protocol) => {
      Object.keys(tranches[chainId][protocol]).forEach( token => {
        const vaultConfig = tranches[chainId][protocol][token]
        const trancheVault = new TrancheVault(web3, chainId, protocol, vaultConfig)
        vaultsContracts.push(trancheVault)
      })
      return vaultsContracts;
    }, [])

    const allVaults = [...underlyingTokensVaults, ...trancheVaults]

    setVaults(allVaults)
    setContracts(contracts)

  }, [web3, chainId])

  // Generate assets data
  useEffect(() => {
    const assetsData = generateAssetsData(vaults)
    setAssetsData(assetsData)
  }, [vaults, generateAssetsData])

  // Get tokens prices, balances, rates
  useEffect(() => {
    if (!vaults || !account || !multiCall || !assetsData || !contracts) {
      if (walletInitialized){
        setBalances({})
      }
      return
    }

    // Get balances promises
    const balanceRawCalls: CallData[] = vaults.reduce( (calls: CallData[], vault: Vault) => {
      const rawCalls = vault.getBalancesCalls([account.address]);
      rawCalls.forEach( rawCall => {
        const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
        if (callData){
          calls.push(callData)
        }
      })
      return calls
    }, [])

    // Get prices promises
    const vaultsPricesRawCalls: CallData[] = vaults.reduce( (calls: CallData[], vault: Vault) => {
      const rawCalls = vault.getPricesCalls();
      rawCalls.forEach( rawCall => {
        const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
        if (callData){
          calls.push(callData)
        }
      })
      return calls
    }, [])

    // Get prices usd promises
    const pricesUsdRawCalls: CallData[] = vaults.reduce( (calls: CallData[], vault: Vault) => {
      const rawCalls = vault.getPricesUsdCalls(contracts);
      rawCalls.forEach( rawCall => {
        const callData = multiCall.getDataFromRawCall(rawCall.call, rawCall)
        if (callData){
          calls.push(callData)
        }
      })
      return calls
    }, [])

    // Execute promises with multicall
    ;(async () => {
      const [
        vaultsPricesCallsResults,
        balanceCallsResults,
        pricesUsdCallsResults
      ] = await multiCall.executeMultipleBatches([
        vaultsPricesRawCalls,
        balanceRawCalls,
        pricesUsdRawCalls
      ])

      // console.log('pricesCallsResults', pricesCallsResults)
      // console.log('pricesUsdCallsResults', pricesUsdCallsResults)
      // console.log('balanceCallsResults', balanceCallsResults)

      const balances = balanceCallsResults.reduce( (balances: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = balances.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetByAddress(assetId)
          if (asset){
            balances[assetId] = BNify(callResult.data.toString()).div(`1e${asset.decimals}`)
            console.log(`Balance ${asset.name}: ${balances[assetId].toString()}`)
          }
        }
        return balances
      }, {})

      const vaultsPrices = vaultsPricesCallsResults.reduce( (vaultsPrices: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetByAddress(assetId)
          if (asset){
            const decimals = callResult.extraData.decimals || asset.decimals
            vaultsPrices[assetId] = BNify(callResult.data.toString()).div(`1e${decimals}`)
            console.log(`Price ${asset.name} ${decimals}: ${vaultsPrices[assetId].toString()}`)
          }
        }
        return vaultsPrices
      }, {})

      const pricesUsd = pricesUsdCallsResults.reduce( (pricesUsd: Balances, callResult: DecodedResult) => {
        if (callResult.data) {
          const assetId = callResult.extraData.assetId?.toString() || callResult.callData.target.toLowerCase()
          const asset = selectAssetByAddress(assetId)
          if (asset){
            pricesUsd[assetId] = callResult.extraData.params.processResults(callResult.data, callResult.extraData.params)
            console.log(`Price Usd ${asset.name}: ${pricesUsd[assetId].toString()}`)
          }
        }
        return pricesUsd
      }, {})

      console.log('balances', balances)
      console.log('pricesUsd', pricesUsd)
      console.log('vaultsPrices', vaultsPrices)

      setBalances(balances)
      setPricesUsd(pricesUsd)
      setVaultsPrices(vaultsPrices)
    })()

  }, [account, vaults, multiCall, assetsData, selectAssetByAddress, walletInitialized])

  useEffect(() => {
    const balancesUsd = Object.keys(balances).reduce( (balancesUsd: Balances, assetId) => {
      const asset = selectAssetByAddress(assetId)
      if (asset) {
        const vaultPrice = selectVaultPrice(assetId)
        const assetBalance = selectAssetBalance(assetId)
        const assetPriceUsd = selectAssetPriceUsd(assetId)

        balancesUsd[assetId] = assetBalance.times(vaultPrice).times(assetPriceUsd)//.times(underlyingTokenPrice)
        console.log(`Balance USD ${asset.name}: ${assetBalance.toString()}, ${vaultPrice.toString()}, ${assetPriceUsd.toString()} ${balancesUsd[assetId].toString()}`)
      }
      return balancesUsd
    }, {})

    setBalancesUsd(balancesUsd)
  }, [balances, vaultsPrices, pricesUsd])

  return (
    <PortfolioProviderContext.Provider value={{balances}}>
      {children}
    </PortfolioProviderContext.Provider>
  )
}
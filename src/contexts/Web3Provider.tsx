import Web3 from 'web3'
import { chains } from 'constants/'
import { Multicall } from 'classes/'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import React, { useState, useContext, useEffect, useMemo } from 'react'

type ContextProps = {
  web3: Web3 | null
  web3Rpc: Web3 | null
  multiCall: Multicall | null
}

const initialState: ContextProps = {
  web3: null,
  web3Rpc: null,
  multiCall: null
}

const Web3ProviderContext = React.createContext<ContextProps>(initialState)

export const useWeb3Provider = () => useContext(Web3ProviderContext)

export function Web3Provider({ children }: ProviderProps) {
  const [ web3, setWeb3 ] = useState<Web3 | null>(null)
  const [ multiCall, setMultiCall ] = useState<Multicall | null>(null)
  const { wallet, chainId, walletInitialized } = useWalletProvider()

  const web3Rpc = useMemo(() => {
    if (!chainId) return null
    return new Web3(new Web3.providers.HttpProvider(chains[chainId].rpcUrl))
  }, [chainId])

  // Update wallet and provider
  useEffect(() => {
    if (!walletInitialized || !chainId) return
    if (wallet?.provider) {
      // @ts-ignore
      setWeb3(new Web3(wallet.provider))
    } else {
      setWeb3(web3Rpc)
    }
  }, [wallet?.provider, walletInitialized, chainId, web3Rpc])

  useEffect(() => {
    if (!chainId || !web3 || !web3Rpc) return

    // @ts-ignore // TO REMOVE
    window.web3 = web3

    // const multiCall = new Multicall(chainId, web3Rpc)
    const multiCall = new Multicall(chainId, web3)
    setMultiCall(multiCall)
  }, [web3, web3Rpc, chainId])

  return (
    <Web3ProviderContext.Provider value={{web3, web3Rpc, multiCall}}>
      {children}
    </Web3ProviderContext.Provider>
  )
}
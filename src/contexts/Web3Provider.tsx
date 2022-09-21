import Web3 from 'web3'
import { chains } from '../constants'
import { Multicall } from '../classes'
import { useWalletProvider } from './WalletProvider'
import type { ProviderProps } from './common/types'
import React, { useState, useContext, useEffect } from 'react'

type ContextProps = {
  web3: Web3 | null
  multiCall: Multicall | null
}

const initialState: ContextProps = {
  web3: null,
  multiCall: null
}

const Web3ProviderContext = React.createContext<ContextProps>(initialState)

export const useWeb3Provider = () => useContext(Web3ProviderContext)

export function Web3Provider({ children }: ProviderProps) {
  const [ web3, setWeb3 ] = useState<Web3 | null>(null)
  const [ multiCall, setMultiCall ] = useState<Multicall | null>(null)
  const { wallet, chainId, walletInitialized } = useWalletProvider()

  // Update wallet and provider
  useEffect(() => {
    if (!walletInitialized || !chainId) return
    if (wallet) {
      // @ts-ignore
      setWeb3(new Web3(wallet.provider))
    } else {
      setWeb3(new Web3(new Web3.providers.HttpProvider(chains[chainId].rpcUrl)))
    }
  }, [wallet, walletInitialized, chainId])

  useEffect(() => {
    if (!chainId || !web3) return
    const multiCall = new Multicall(chainId, web3)
    setMultiCall(multiCall)
  }, [web3, chainId])

  return (
    <Web3ProviderContext.Provider value={{web3, multiCall}}>
      {children}
    </Web3ProviderContext.Provider>
  )
}
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
  web3Chains: Record<string, Web3> | null
}

const initialState: ContextProps = {
  web3: null,
  web3Rpc: null,
  multiCall: null,
  web3Chains: null
}

const Web3ProviderContext = React.createContext<ContextProps>(initialState)

export const useWeb3Provider = () => useContext(Web3ProviderContext)

export function Web3Provider({ children }: ProviderProps) {
  // const [ web3, setWeb3 ] = useState<Web3 | null>(null)
  const { connecting, wallet, chainId, walletInitialized } = useWalletProvider()
  const [ multiCall, setMultiCall ] = useState<Multicall | null>(null)

  const web3Rpc = useMemo(() => {
    if (!chainId) return null
    const rpcUrl = chains[chainId]?.rpcUrl
    if (!rpcUrl) return null
    return new Web3(new Web3.providers.HttpProvider(rpcUrl))
  }, [chainId])

  const web3Chains = useMemo(() => {
    return Object.keys(chains).reduce( (web3Chains: Record<string, Web3>, chainId: any) => {
      const rpcUrl = chains[chainId]?.rpcUrl
      if (!chainId || !rpcUrl) return web3Chains
      return {
        ...web3Chains,
        [chainId]: new Web3(new Web3.providers.HttpProvider(rpcUrl))
      }
    }, {})
  }, []);

  const web3 = useMemo(() => {
    if (!walletInitialized || connecting) return null
    if (wallet?.provider){
      // @ts-ignore
      return new Web3(wallet.provider)
    } else {
      return web3Rpc
    }
  }, [wallet?.provider, connecting, walletInitialized, web3Rpc])

  // @ts-ignore // TO REMOVE
  window.web3 = web3

  // Update wallet and provider
  // useEffect(() => {
  //   console.log('wallet.provider', walletInitialized, chainId, wallet?.provider)
  //   if (!walletInitialized || !chainId) return
  //   if (wallet?.provider) {
  //     // @ts-ignore
  //     setWeb3(new Web3(wallet.provider))
  //   } else {
  //     setWeb3(web3Rpc)
  //   }
  // }, [wallet?.provider, walletInitialized, chainId, web3Rpc])

  useEffect(() => {
    if (!chainId || !web3 || !web3Rpc) return

    // const multiCall = new Multicall(chainId, web3Rpc)
    const multiCall = new Multicall(chainId, web3)
    setMultiCall(multiCall)
  }, [web3, web3Rpc, chainId])

  return (
    <Web3ProviderContext.Provider value={{web3, web3Rpc, web3Chains, multiCall}}>
      {children}
    </Web3ProviderContext.Provider>
  )
}
import Web3 from 'web3'
import { chains } from 'constants/'
import { Multicall } from 'classes/'
import { isEmpty, asyncReduce } from 'helpers/'
import type { ProviderProps } from './common/types'
import { useWalletProvider } from './WalletProvider'
import React, { useState, useContext, useEffect, useMemo } from 'react'

type ContextProps = {
  web3: Web3 | null
  web3Rpc: Web3 | null
  latestBlock: number | null
  multiCall: Multicall | null
  web3Chains: Record<string, Web3> | null
}

const initialState: ContextProps = {
  web3: null,
  web3Rpc: null,
  multiCall: null,
  web3Chains: null,
  latestBlock: null
}

const Web3ProviderContext = React.createContext<ContextProps>(initialState)

export const useWeb3Provider = () => useContext(Web3ProviderContext)

export function Web3Provider({ children }: ProviderProps) {
  const [ multiCall, setMultiCall ] = useState<Multicall | null>(null)
  const [ latestBlock, setLatestBlock ] = useState<number | null>(null)
  const { connecting, wallet, chainId, walletInitialized } = useWalletProvider()
  const [ web3Chains, setWeb3Chains ] = useState<Record<string, Web3> | null>(null)

  const web3Rpc = useMemo(() => {
    if (!chainId || !web3Chains || isEmpty(web3Chains)) return null
    return web3Chains[chainId]
  }, [chainId, web3Chains])

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

  useEffect(() => {
    if (!web3) return;
    ;(async()=>{
      const blockNumber = await web3.eth.getBlockNumber()
      if (blockNumber){
        setLatestBlock(blockNumber)
      }
    })()
  }, [web3, setLatestBlock])

  // Check and load RPCs
  useEffect(() => {
    if (!isEmpty(web3Chains)) return;
    ;(async() => {
      // Check custom RPCs otherwise use public ones
      const newWeb3Chains = await asyncReduce<any, Record<string, Web3>>(
        Object.keys(chains),
        async (chainId: any) => {
          const rpcUrl = chains[chainId].rpcUrl as string
          const publicRpcUrl = chains[chainId].publicRpcUrl as string
          const web3Private = new Web3(new Web3.providers.HttpProvider(rpcUrl))
          const web3Public = new Web3(new Web3.providers.HttpProvider(publicRpcUrl))
          try {
            await web3Private.eth.getBlockNumber()
            return {
              [chainId]: web3Private
            }
          } catch (err){
            return {
              [chainId]: web3Public
            }
          }
        },
        (web3Chains, chainWeb3) => {
          return {
            ...web3Chains,
            ...chainWeb3
          }
        },
        {}
      )
      setWeb3Chains(newWeb3Chains)
    })()
  }, [web3Chains, setWeb3Chains])

  // Check and load RPCs
  useEffect(() => {
    if (!chainId || isEmpty(web3Chains)) return

    ;(async() => {
      // Check custom RPCs otherwise use public ones
      const newWeb3Chains = await asyncReduce<any, Record<string, Web3>>(
        Object.keys(chains),
        async (chainId: any) => {
          const rpcUrl = chains[chainId].rpcUrl as string
          const publicRpcUrl = chains[chainId].publicRpcUrl as string
          const web3Private = new Web3(new Web3.providers.HttpProvider(rpcUrl))
          const web3Public = new Web3(new Web3.providers.HttpProvider(publicRpcUrl))
          try {
            await web3Private.eth.getBlockNumber()
            return {
              [chainId]: web3Private
            }
          } catch (err){
            return {
              [chainId]: web3Public
            }
          }
        },
        (web3Chains, chainWeb3) => {
          return {
            ...web3Chains,
            ...chainWeb3
          }
        },
        {}
      )
      setWeb3Chains(newWeb3Chains)
    })()
  }, [chainId, web3Chains, setWeb3Chains])

  useEffect(() => {
    if (!chainId || isEmpty(web3Chains)) return
    const multiCall = new Multicall(chainId, web3Chains)
    setMultiCall(multiCall)
  }, [web3Chains, chainId])

  return (
    <Web3ProviderContext.Provider value={{web3, web3Rpc, web3Chains, multiCall, latestBlock}}>
      {children}
    </Web3ProviderContext.Provider>
  )
}
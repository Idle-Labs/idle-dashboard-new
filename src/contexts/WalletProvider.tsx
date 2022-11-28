import type { Account } from 'constants/types'
import useLocalForge from 'hooks/useLocalForge'
import { selectUnderlyingToken } from 'selectors/'
import type { ProviderProps } from './common/types'
import { onboardInitParams } from './configs/onboard'
import type { WalletState } from '@web3-onboard/core'
import React, { useState, useContext, useEffect, useMemo } from 'react'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'
import { chains, networks, explorers, defaultChainId, Network, Explorer, UnderlyingTokenProps } from 'constants/'

// @ts-ignore
init(onboardInitParams)

type ContextProps = {
  account: Account | null
  chainId: number
  network: Network | null
  explorer: Explorer | null
  wallet: WalletState | null
  connecting: boolean
  connect: Function
  disconnect: Function
  setChainId: Function
  isNetworkCorrect: boolean
  walletInitialized: boolean
  chainToken: UnderlyingTokenProps | null
}

const initialState: ContextProps = {
  account: null,
  wallet: null,
  network: null,
  explorer: null,
  chainToken: null,
  connecting: false,
  connect: () => {},
  disconnect: () => {},
  setChainId: () => {},
  isNetworkCorrect: true,
  chainId: defaultChainId,
  walletInitialized: false
}

const WalletProviderContext = React.createContext<ContextProps>(initialState)

export const useWalletProvider = () => useContext(WalletProviderContext)

export function WalletProvider({ children }: ProviderProps) {
  const [ { connectedChain }, setChain ] = useSetChain()
  const [ account, setAccount ] = useState<Account | null>(null)
  const [ isNetworkCorrect, setIsNetworkCorrect ] = useState<boolean>(false)
  const [ { wallet, connecting }, connect, disconnect ] = useConnectWallet()
  const [ walletInitialized, setWalletInitialized ] = useState<boolean>(false)
  const [ chainId, setChainId ] = useLocalForge('selectedChain', defaultChainId)
  const [ walletProvider, setWalletProvider, removeWalletProvider, isWalletProviderLoaded ] = useLocalForge('walletProvider', undefined)

  const chainIdHex = useMemo(() => {
    return chains[chainId].id
  }, [chainId])

  const network = useMemo(() => {
    return networks[chainId]
  }, [chainId])

  const explorer = useMemo(() => {
    return explorers[network.explorer]
  }, [network])

  const chainToken = useMemo(() => {
    return selectUnderlyingToken(chainId, chains[chainId].token) || null
  }, [chainId])

  // Auto-connect wallet
  useEffect(() => {
    if (!isWalletProviderLoaded) return
    ;(async () => {
      if (!wallet && walletProvider){
        await connect({autoSelect: { label: walletProvider, disableModals: true }})
      }
      setWalletInitialized(true)
    })()
  // eslint-disable-next-line
  }, [walletProvider, isWalletProviderLoaded])

  // Switch chain
  useEffect(() => {
    if (!wallet || connecting) return
    // console.log(initChains, connectedChain, settingChain)
    setChain({
      chainId: chainIdHex
    })
  }, [chainIdHex, setChain, wallet, connecting])

  // Set isNetworkCorrect
  useEffect(() => {
    if (!connectedChain) return
    const isNetworkCorrect = chainIdHex === connectedChain.id
    setIsNetworkCorrect(isNetworkCorrect)
  }, [chainIdHex, connectedChain])

  // Update wallet and provider
  useEffect(() => {
    if (connecting) return
    if (wallet) {
      setWalletProvider(wallet.label)
        
      // console.log('setAccount', wallet.accounts[0])
      setAccount(wallet.accounts[0])

      // Set custom wallet
      // setAccount({
      //   address: "0xdc27620f4e2e3728c2a3d209f748f82eb1e99031",
      //   ens: null,
      //   balance: {
      //     ETH: "0.838159899709204532"
      //   }
      // })
    }
  }, [wallet, connecting, setWalletProvider])

  const disconnectWallet = async () => {
    if (wallet) {
      setAccount(null)
      removeWalletProvider()
      disconnect(wallet)
    }
  }

  return (
    <WalletProviderContext.Provider value={{wallet, account, network, explorer, walletInitialized, isNetworkCorrect, chainId, chainToken, setChainId, connecting, connect, disconnect: disconnectWallet}}>
      {children}
    </WalletProviderContext.Provider>
  )
}
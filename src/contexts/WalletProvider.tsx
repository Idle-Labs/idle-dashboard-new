import type { Account } from '../constants/types'
import useLocalForge from '../hooks/useLocalForge'
import type { ProviderProps } from './common/types'
import { chains, defaultChainId } from '../constants'
import type { WalletState } from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets'
import React, { useState, useContext, useEffect, useMemo } from 'react'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'

const injected = injectedModule()

// initialize Onboard
init({
  wallets: [injected],
  chains: Object.values(chains),
  accountCenter: {
    desktop: {
      enabled: false
    },
    mobile: {
      enabled: false
    }
  },
  notify: {
   enabled: true,
   position: 'bottomRight',
   transactionHandler: transaction => {
     console.log('transaction', transaction)
     if (transaction.eventCode === 'txPool') {
       return {
         autoDismiss: 0,
         onClick: () =>
          window.open(`https://etherscan.io/tx/${transaction.hash}`)
       }
     }
   }
  }
})

type ContextProps = {
  account: Account | null
  chainId: number
  wallet: WalletState | null
  connecting: boolean
  connect: Function
  disconnect: Function
  setChainId: Function
  isNetworkCorrect: boolean
  walletInitialized: boolean
}

const initialState: ContextProps = {
  account: null,
  wallet: null,
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
  const [ account, setAccount ] = useState<Account | null>(null)
  const [ isNetworkCorrect, setIsNetworkCorrect ] = useState<boolean>(false)
  const [ { wallet, connecting }, connect, disconnect ] = useConnectWallet()
  const [ walletInitialized, setWalletInitialized ] = useState<boolean>(false)
  const [ chainId, setChainId ] = useLocalForge('selectedChain', defaultChainId)
  const [ { connectedChain }, setChain ] = useSetChain()
  const [ walletProvider, setWalletProvider, removeWalletProvider, isWalletProviderLoaded ] = useLocalForge('walletProvider', undefined)

  const chainIdHex = useMemo(() => {
    return chains[chainId].id
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
      setAccount(wallet.accounts[0])
    }
  }, [walletProvider, wallet, connect, connecting, setWalletProvider])

  const disconnectWallet = async () => {
    if (wallet) {
      setAccount(null)
      removeWalletProvider()
      disconnect(wallet)
    }
  }

  return (
    <WalletProviderContext.Provider value={{wallet, account, walletInitialized, isNetworkCorrect, chainId, setChainId, connecting, connect, disconnect: disconnectWallet}}>
      {children}
    </WalletProviderContext.Provider>
  )
}
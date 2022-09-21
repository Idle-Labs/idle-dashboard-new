import type { Account } from '../constants/types'
import useLocalForge from '../hooks/useLocalForge'
import type { ProviderProps } from './common/types'
import type { WalletState } from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets'
import { chains, defaultChainId } from '../constants'
import React, { useState, useContext, useEffect } from 'react'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'

const injected = injectedModule()

// initialize Onboard
init({
  wallets: [injected],
  chains: Object.values(chains),
  notify: {
   enabled: true,
   position: 'topRight',
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
  walletInitialized: boolean
}

const initialState: ContextProps = {
  account: null,
  wallet: null,
  connecting: false,
  connect: () => {},
  disconnect: () => {},
  chainId: defaultChainId,
  walletInitialized: false
}

const WalletProviderContext = React.createContext<ContextProps>(initialState)

export const useWalletProvider = () => useContext(WalletProviderContext)

export function WalletProvider({ children }: ProviderProps) {
  const [ { wallet, connecting }, connect, disconnect ] = useConnectWallet()
  // const [ { chains, connectedChain, settingChain }, setChain ] = useSetChain()
  const [ account, setAccount ] = useState<Account | null>(null)
  const [ walletInitialized, setWalletInitialized ] = useState<boolean>(false)
  const [ chainId, setChainId, removeChainId ] = useLocalForge('selectedChain', defaultChainId)
  const [ walletProvider, setWalletProvider, removeWalletProvider, isWalletProviderLoaded ] = useLocalForge('walletProvider', undefined)

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
    <WalletProviderContext.Provider value={{wallet, account, walletInitialized, chainId, connecting, connect, disconnect: disconnectWallet}}>
      {children}
    </WalletProviderContext.Provider>
  )
}
import { checkAddress } from 'helpers/'
import type { Account } from 'constants/types'
import useLocalForge from 'hooks/useLocalForge'
import { selectUnderlyingToken } from 'selectors/'
import { useSearchParams } from 'react-router-dom'
import type { ProviderProps } from './common/types'
import { onboardInitParams } from './configs/onboard'
import type { WalletState } from '@web3-onboard/core'
import { usePrevious } from 'hooks/usePrevious/usePrevious'
import React, { useState, useContext, useEffect, useMemo } from 'react'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'
import { chains, networks, explorers, defaultChainId, Network, Explorer, UnderlyingTokenProps } from 'constants/'

// @ts-ignore
init(onboardInitParams)

type ContextProps = {
  account: Account | null
  prevAccount: Account | null | undefined
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
  prevAccount: null,
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
  const searchParams = useSearchParams()
  const [ { connectedChain }, setChain ] = useSetChain()
  const [ account, setAccount ] = useState<Account | null>(null)
  const prevAccount = usePrevious<Account | null>(account)
  const [ isNetworkCorrect, setIsNetworkCorrect ] = useState<boolean>(false)
  const [ { wallet, connecting }, connect, disconnect ] = useConnectWallet()
  const [ walletInitialized, setWalletInitialized ] = useState<boolean>(false)
  const [ chainId, setChainId ] = useLocalForge('selectedChain', defaultChainId)
  const [ getSearchParams ] = useMemo(() => searchParams, [searchParams])
  const [ walletProvider, setWalletProvider, removeWalletProvider, isWalletProviderLoaded ] = useLocalForge('walletProvider', undefined)

  const customAddress = useMemo(() => {
    const walletAddress = getSearchParams.get('wallet')
    return walletAddress && checkAddress(walletAddress) ? walletAddress : null
  }, [getSearchParams])

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
    if (customAddress){
      setWalletProvider('metamask')
      setAccount({
        address: customAddress,
        ens: null,
        balance: {
          ETH: "0"
        }
      })
    } else if (wallet) {
      if (connecting) return
      setWalletProvider(wallet.label)
      setAccount(wallet.accounts[0])
      // console.log('setAccount', wallet.accounts[0])

      // Set custom wallet
      // setAccount({
      //   address: "0xFb3bD022D5DAcF95eE28a6B07825D4Ff9C5b3814",
      //   ens: null,
      //   balance: {
      //     ETH: "0.838159899709204532"
      //   }
      // })
    }
  }, [wallet, customAddress, connecting, setWalletProvider])

  const disconnectWallet = async () => {
    if (wallet) {
      setAccount(null)
      removeWalletProvider()
      disconnect(wallet)
    }
  }

  // console.log('wallet', wallet, 'account', account, 'network', network, 'walletInitialized', walletInitialized, 'isNetworkCorrect', isNetworkCorrect, 'chainId', chainId, 'connecting', connecting)

  return (
    <WalletProviderContext.Provider value={{wallet, prevAccount, account, network, explorer, walletInitialized, isNetworkCorrect, chainId, chainToken, setChainId, connecting, connect, disconnect: disconnectWallet}}>
      {children}
    </WalletProviderContext.Provider>
  )
}
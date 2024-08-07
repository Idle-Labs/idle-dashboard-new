import useLocalForge from 'hooks/useLocalForge'
import { selectUnderlyingToken } from 'selectors/'
import { useSearchParams } from 'react-router-dom'
import type { ProviderProps } from './common/types'
import type { WalletState } from '@web3-onboard/core'
import type { Account, Address } from 'constants/types'
import { getOnBoardInitParams } from './configs/onboard'
import { usePrevious } from 'hooks/usePrevious/usePrevious'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'
import { checkAddress, sendLogin, sendChainId, isEmpty, cmpAddrs } from 'helpers/'
import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react'
import { defaultChainId, chains, networks, explorers, Network, Explorer, UnderlyingTokenProps } from 'constants/'

const onboardInitParams = getOnBoardInitParams()
// @ts-ignore
init(onboardInitParams)

type ContextProps = {
  connect: Function
  connecting: boolean
  disconnect: Function
  setChainId: Function
  disconnecting: boolean
  chainId: number | null
  account: Account | null
  wallet: WalletState | null
  walletInitialized: boolean
  checkChainEnabled: Function
  network: Network | null | undefined
  chainIdHex: string | null | undefined
  explorer: Explorer | null | undefined
  prevChainId: number | undefined | null
  prevAccount: Account | null | undefined
  chainToken: UnderlyingTokenProps | null | undefined
}

const initialState: ContextProps = {
  wallet: null,
  account: null,
  network: null,
  chainId: null,
  explorer: null,
  chainIdHex: null,
  chainToken: null,
  connecting: false,
  prevAccount: null,
  prevChainId: null,
  connect: () => {},
  disconnecting: false,
  disconnect: () => {},
  setChainId: () => {},
  walletInitialized: false,
  checkChainEnabled: () => {}
}

const WalletProviderContext = React.createContext<ContextProps>(initialState)

export const useWalletProvider = () => useContext(WalletProviderContext)

export function WalletProvider({ children }: ProviderProps) {
  const searchParams = useSearchParams()
  
  const [ account, setAccount ] = useState<Account | null>(null)
  const prevAccount = usePrevious<Account | null>(account)

  const [ { connectedChain }, setChain ] = useSetChain()
  const [ getSearchParams ] = useMemo(() => searchParams, [searchParams])

  const [ disconnecting, setDisconnecting ] = useState<boolean>(false)
  const [ { wallet, connecting }, connect, disconnect ] = useConnectWallet()
  const [ walletInitialized, setWalletInitialized ] = useState<boolean>(false)
  const [ walletProvider, setWalletProvider, removeWalletProvider, isWalletProviderLoaded ] = useLocalForge('walletProvider', undefined)

  const customAddress: Address | null = useMemo(() => {
    const walletAddress = getSearchParams.get('wallet')
    return walletAddress && checkAddress(walletAddress) ? walletAddress as Address : null
  }, [getSearchParams])

  const setChainId = useCallback((chainId: number) => {
    const chainIdHex = chains[chainId]?.id
    if (!chainIdHex) return
    setChain({
      chainId: chainIdHex
    })
  }, [setChain])

  const chainId = useMemo(() => {
    if (!connectedChain) return defaultChainId
    return parseInt(connectedChain.id)
  }, [connectedChain])

  const prevChainId = usePrevious<number | null>(chainId)

  const chainIdHex = useMemo(() => {
    if (!connectedChain) return
    return connectedChain.id
  }, [connectedChain])

  const network = useMemo(() => {
    if (!chainId || !networks[chainId]) return networks[0]
    return networks[chainId]
  }, [chainId])

  const explorer = useMemo(() => {
    if (!network) return
    return explorers[network.explorer]
  }, [network])

  const chainToken = useMemo(() => {
    if (!chainId || !chains[chainId]) return
    return selectUnderlyingToken(chainId, chains[chainId].token) || null
  }, [chainId])

  const checkChainEnabled = useCallback((chainIds: (string|number)[]) => {
    return !chainIds.length || (chainId && chainIds.includes(+chainId))
  }, [chainId])

  // Auto-connect wallet
  useEffect(() => {
    if (!isWalletProviderLoaded || disconnecting) return
    ;(async () => {
      if (!wallet && walletProvider){
        await connect({autoSelect: { label: walletProvider, disableModals: true }})
      }
    })()
  // eslint-disable-next-line
  }, [walletProvider, isWalletProviderLoaded, connectedChain, disconnecting])

  // Send chainID
  useEffect(() => {
    if (!connectedChain) return
    sendChainId(connectedChain.id, window.location.hostname)
  }, [connectedChain])

  // Update wallet and provider
  useEffect(() => {
    if (disconnecting) return;
    if (customAddress){
      // Skip if already set
      if (cmpAddrs(account?.address, customAddress)) return
      setWalletProvider('metamask')
      setAccount({
        isCustom: true,
        address: customAddress,
        ens: null,
        balance: {
          ETH: "0"
        }
      })
      sendLogin('Custom wallet')
    } else if (wallet) {
      if (isEmpty(wallet.accounts)) return

      // Get first valid account from the provider
      const firstValidAccount: Account | null = wallet.accounts.find( account => checkAddress(account.address) ) || null

      if (!firstValidAccount || account?.address === firstValidAccount.address) return

      setWalletProvider(wallet.label)
      setAccount({
        ...firstValidAccount,
        isCustom: false
      })
      sendLogin(wallet.label, firstValidAccount?.address)
    }
  }, [wallet, customAddress, connecting, account, setWalletProvider, disconnecting])

  // Set walletInitialized
  useEffect(() => {
    if (connecting || !isWalletProviderLoaded) return
    const walletInitialized = !!(!walletProvider || !wallet || account?.address)
    setWalletInitialized(walletInitialized)
  }, [account, connecting, wallet, walletProvider, isWalletProviderLoaded])

  const disconnectWallet = useCallback(async () => {
    setDisconnecting(true)
    setAccount(null)
    if (wallet){
      await disconnect(wallet)
    }
    await removeWalletProvider()
    setDisconnecting(false)
  // eslint-disable-next-line
  }, [wallet, setAccount, removeWalletProvider, disconnect, setDisconnecting])

  return (
    <WalletProviderContext.Provider value={{wallet, prevAccount, account, disconnecting, network, explorer, walletInitialized, chainId, prevChainId, chainIdHex, checkChainEnabled, chainToken, setChainId, connecting, connect, disconnect: disconnectWallet}}>
      {children}
    </WalletProviderContext.Provider>
  )
}
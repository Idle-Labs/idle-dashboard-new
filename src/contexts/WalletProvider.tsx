import useLocalForge from 'hooks/useLocalForge'
import { selectUnderlyingToken } from 'selectors/'
import { useSearchParams } from 'react-router-dom'
import type { ProviderProps } from './common/types'
import type { WalletState } from '@web3-onboard/core'
import type { Account, Address } from 'constants/types'
import { getOnBoardInitParams } from './configs/onboard'
import { usePrevious } from 'hooks/usePrevious/usePrevious'
import { checkAddress, sendLogin, sendChainId } from 'helpers/'
import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'
import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react'
import { chains, networks, explorers, defaultChainId, Network, Explorer, UnderlyingTokenProps } from 'constants/'

const onboardInitParams = getOnBoardInitParams()
// @ts-ignore
init(onboardInitParams)

type ContextProps = {
  chainId: number
  connect: Function
  connecting: boolean
  disconnect: Function
  setChainId: Function
  isChainLoaded: boolean
  account: Account | null
  network: Network | null
  explorer: Explorer | null
  chainIdHex: string | null
  isNetworkCorrect: boolean
  wallet: WalletState | null
  walletInitialized: boolean
  checkChainEnabled: Function
  prevChainId: number | undefined
  prevAccount: Account | null | undefined
  chainToken: UnderlyingTokenProps | null
  connectedChainId: number | null | undefined
}

const initialState: ContextProps = {
  account: null,
  wallet: null,
  network: null,
  explorer: null,
  chainIdHex: null,
  chainToken: null,
  connecting: false,
  prevAccount: null,
  connect: () => {},
  isChainLoaded: false,
  disconnect: () => {},
  setChainId: () => {},
  connectedChainId: null,
  isNetworkCorrect: true,
  chainId: defaultChainId,
  walletInitialized: false,
  prevChainId: defaultChainId,
  checkChainEnabled: () => {}
}

const WalletProviderContext = React.createContext<ContextProps>(initialState)

export const useWalletProvider = () => useContext(WalletProviderContext)

export function WalletProvider({ children }: ProviderProps) {
  const searchParams = useSearchParams()
  
  const [ account, setAccount ] = useState<Account | null>(null)
  const prevAccount = usePrevious<Account | null>(account)

  const hostnameChainId = useMemo(() : number => {
    const hostnameChainId = Object.keys(networks).find( (chainId: string) => {
      return networks[+chainId].hostName && networks[+chainId].hostName?.toLowerCase() === window.location.hostname.toLowerCase()
    })
    return hostnameChainId && chains[+hostnameChainId] ? +hostnameChainId : defaultChainId
  }, [])

  const [ { connectedChain }, setChain ] = useSetChain()
  const [ chainId, setChainIdState ] = useState<number>(hostnameChainId)
  const [ getSearchParams ] = useMemo(() => searchParams, [searchParams])
  const [ { wallet, connecting }, connect, disconnect ] = useConnectWallet()
  const [ walletInitialized, setWalletInitialized ] = useState<boolean>(false)
  const [ chainSetFromStorage, setChainSetFromStorage ] = useState<boolean>(false)
  const [ storedChainId, setStoredChainId, , isChainLoaded ] = useLocalForge('selectedChain', hostnameChainId)
  const [ walletProvider, setWalletProvider, removeWalletProvider, isWalletProviderLoaded ] = useLocalForge('walletProvider', undefined)
  const prevChainId = usePrevious<number>(chainId)

  const customAddress: Address | null = useMemo(() => {
    const walletAddress = getSearchParams.get('wallet')
    return walletAddress && checkAddress(walletAddress) ? walletAddress as Address : null
  }, [getSearchParams])

  const setChainId = useCallback((chainId: number) => {
    setStoredChainId(+chainId)
    setChainIdState(+chainId)
  }, [setChainIdState, setStoredChainId])

  const chainIdHex = useMemo(() => {
    return chains[chainId].id
  }, [chainId])

  const connectedChainId = useMemo(() => {
    const connectedChainId = Object.keys(chains).find( (chainId: string) => (chains[+chainId].id === connectedChain?.id) )
    return !!connectedChainId ? +connectedChainId : null
  }, [connectedChain])

  const network = useMemo(() => {
    return networks[chainId]
  }, [chainId])

  const explorer = useMemo(() => {
    return explorers[network.explorer]
  }, [network])

  const chainToken = useMemo(() => {
    return selectUnderlyingToken(chainId, chains[chainId].token) || null
  }, [chainId])

  const checkChainEnabled = useCallback((chainIds: (string|number)[]) => {
    return !chainIds.length || (chainId && chainIds.includes(+chainId))
  }, [chainId])

  const isNetworkCorrect = useMemo(() => {
    return !wallet || chainIdHex === connectedChain?.id
  }, [chainIdHex, connectedChain, wallet])

  // Set chainId to stored chainId
  useEffect(() => {
    if (!isChainLoaded || chainSetFromStorage) return
    if (+storedChainId && +chainId !== +storedChainId){
      if (chains[+storedChainId]){
        setChainIdState(storedChainId)
      // Stored chainId not available, set default chainID
      } else {
        setStoredChainId(hostnameChainId)
        setChainIdState(hostnameChainId)
      }
    }
    setChainSetFromStorage(true)
  }, [chainId, hostnameChainId, setChainIdState, storedChainId, setStoredChainId, chainSetFromStorage, isChainLoaded])

  // Auto-connect wallet
  useEffect(() => {
    if (!isWalletProviderLoaded) return
    ;(async () => {
      if (!wallet && walletProvider){
        await connect({autoSelect: { label: walletProvider, disableModals: true }})
      }
    })()
  // eslint-disable-next-line
  }, [walletProvider, isWalletProviderLoaded])

  // Switch chain
  useEffect(() => {
    if (!wallet || connecting || isNetworkCorrect) return
    setChain({
      chainId: chainIdHex
    })
  }, [chainIdHex, isNetworkCorrect, setChain, wallet, connecting, connectedChain])

  // Send chainID
  useEffect(() => {
    if (!isChainLoaded || !isNetworkCorrect) return
    sendChainId(chainIdHex, window.location.hostname)
  }, [isChainLoaded, isNetworkCorrect, chainIdHex])

  useEffect(() => {
    const onboardInitParams = getOnBoardInitParams(chainId)
    // @ts-ignore
    init(onboardInitParams)
  }, [chainId])

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
      sendLogin('Custom wallet')
    } else if (wallet) {
      if (connecting) return
      setWalletProvider(wallet.label)
      setAccount(wallet.accounts[0])
      sendLogin(wallet.label, wallet.accounts[0]?.address)
    }
  }, [wallet, customAddress, connecting, setWalletProvider])

  // Set walletInitialized
  useEffect(() => {
    if (connecting || !isWalletProviderLoaded) return
    const walletInitialized = !!(!walletProvider || account?.address)
    setWalletInitialized(walletInitialized)
  }, [account, connecting, walletProvider, isWalletProviderLoaded])

  const disconnectWallet = async () => {
    if (wallet) {
      setAccount(null)
      removeWalletProvider()
      disconnect(wallet)
    }
  }

  return (
    <WalletProviderContext.Provider value={{wallet, connectedChainId, prevAccount, account, network, explorer, walletInitialized, isNetworkCorrect, chainId, isChainLoaded, prevChainId, chainIdHex, checkChainEnabled, chainToken, setChainId, connecting, connect, disconnect: disconnectWallet}}>
      {children}
    </WalletProviderContext.Provider>
  )
}
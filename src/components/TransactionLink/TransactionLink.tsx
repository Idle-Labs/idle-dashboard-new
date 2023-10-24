import React, { useMemo } from 'react'
import { LinkProps, Link } from '@chakra-ui/react'
import { getExplorerTxUrl, shortenHash } from 'helpers/'
import { useWalletProvider } from 'contexts/WalletProvider'

type TransactionLinkArgs = {
  hash: string
  chainId?: number
} & LinkProps

export const TransactionLink: React.FC<TransactionLinkArgs> = ({ hash, chainId = null, ...props }) => {
  const { chainId: currentChainId } = useWalletProvider()

  const selectedChainId = useMemo(() => {
    return chainId || currentChainId
  }, [chainId, currentChainId])

  const url = useMemo(() => {
    return getExplorerTxUrl(selectedChainId, hash)
  }, [selectedChainId, hash])

  return (
    <Link href={url} textStyle={'tableCell'} color={'link'} isExternal {...props}>{shortenHash(hash)}</Link>
  )
}
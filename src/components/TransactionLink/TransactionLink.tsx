import React, { useMemo } from 'react'
import { LinkProps, Link } from '@chakra-ui/react'
import { getExplorerTxUrl, shortenHash } from 'helpers/'
import { useWalletProvider } from 'contexts/WalletProvider'

type TransactionLinkArgs = {
  hash: string
} & LinkProps

export const TransactionLink: React.FC<TransactionLinkArgs> = ({ hash, ...props }) => {
  const { chainId, explorer } = useWalletProvider()
  const url = useMemo(() => {
    return getExplorerTxUrl(chainId, explorer, hash)
  }, [chainId, explorer, hash])

  return (
    <Link href={url} textStyle={'tableCell'} color={'link'} isExternal {...props}>{shortenHash(hash)}</Link>
  )
}
import React, { useMemo } from 'react'
import { Link } from '@chakra-ui/react'
import { getExplorerTxUrl, shortenHash } from 'helpers/'
import { useWalletProvider } from 'contexts/WalletProvider'

type TransactionLinkArgs = {
  hash: string
}

export const TransactionLink: React.FC<TransactionLinkArgs> = ({ hash }) => {
  const { chainId, explorer } = useWalletProvider()
  const url = useMemo(() => {
    return getExplorerTxUrl(chainId, explorer, hash)
  }, [chainId, explorer, hash])

  return (
    <Link href={url} textStyle={'tableCell'} color={'link'} isExternal>{shortenHash(hash)}</Link>
  )
}
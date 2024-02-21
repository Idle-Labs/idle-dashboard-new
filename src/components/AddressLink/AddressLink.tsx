import React, { useMemo } from 'react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { LinkProps, Link, Spinner } from '@chakra-ui/react'
import { getExplorerAddressUrl, shortenHash } from 'helpers/'

type AddressLinkArgs = {
  address: string
  text?: string
  chainId?: number
} & LinkProps

export const AddressLink: React.FC<AddressLinkArgs> = ({ address, text, chainId, ...props }) => {
  const { explorer } = useWalletProvider()
  const url = useMemo(() => {
    return getExplorerAddressUrl(chainId, explorer, address)
  }, [chainId, explorer, address])

  return chainId && explorer ? (
    <Link href={url} textStyle={'tableCell'} color={'link'} isExternal {...props}>{text || shortenHash(address)}</Link>
  ) : <Spinner size={'sm'} />
}
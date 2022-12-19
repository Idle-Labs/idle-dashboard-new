import React, { useMemo } from 'react'
import { LinkProps, Link } from '@chakra-ui/react'
import { getExplorerAddressUrl, shortenHash } from 'helpers/'
import { useWalletProvider } from 'contexts/WalletProvider'

type AddressLinkArgs = {
  address: string
} & LinkProps

export const AddressLink: React.FC<AddressLinkArgs> = ({ address, ...props }) => {
  const { chainId, explorer } = useWalletProvider()
  const url = useMemo(() => {
    return getExplorerAddressUrl(chainId, explorer, address)
  }, [chainId, explorer, address])

  return (
    <Link href={url} textStyle={'tableCell'} color={'link'} isExternal {...props}>{shortenHash(address)}</Link>
  )
}
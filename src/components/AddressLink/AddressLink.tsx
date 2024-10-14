import React, { useMemo } from 'react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { LinkProps, Link, Spinner, HStack } from '@chakra-ui/react'
import { getExplorerAddressUrl, shortenHash } from 'helpers/'
import { MdOpenInNew } from 'react-icons/md'
import { useThemeProvider } from 'contexts/ThemeProvider'

type AddressLinkArgs = {
  address: string
  text?: string
  chainId?: number
  shorten?: boolean
} & LinkProps

export const AddressLink: React.FC<AddressLinkArgs> = ({ address, text, chainId, shorten = true, ...props }) => {
  const { theme } = useThemeProvider()
  const { explorer } = useWalletProvider()
  const url = useMemo(() => {
    return getExplorerAddressUrl(chainId, explorer, address)
  }, [chainId, explorer, address])

  return chainId && explorer ? (
    <HStack
      spacing={1}
    >
      <Link href={url} textStyle={'tableCell'} color={'link'} isExternal {...props}>{text || shorten ? shortenHash(address) : address}</Link>
      <MdOpenInNew color={theme.colors.cta} />
    </HStack>
  ) : <Spinner size={'sm'} />
}
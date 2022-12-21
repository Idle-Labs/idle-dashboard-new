import React, { useMemo } from 'react'
import { TopBarMenu } from './Menu/TopBarMenu'
import { selectUnderlyingToken } from 'selectors/'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { useWalletProvider } from 'contexts/WalletProvider'
import { ContainerProps, HStack, Stack } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

export const Header: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { screenSize } = useThemeProvider()
  const isMobile = screenSize === 'sm'
  const { chainId, account } = useWalletProvider()

  const assetBalance = useMemo(() => {
    if (!account?.address) return null
    const idleToken = selectUnderlyingToken(chainId, 'IDLE')
    return (
      <AssetProvider assetId={idleToken?.address}>
        <HStack
          spacing={0}
          width={'100%'}
          alignItems={'center'}
        >
          <AssetProvider.Icon size={'xs'} mr={2} />
          <AssetProvider.Balance decimals={isMobile ? 0 : 2} textStyle={'cta'} />
        </HStack>
      </AssetProvider>
    )
  }, [account, chainId, isMobile])

  return (
    <HStack
      spacing={0}
      justifyContent={'space-between'}
    >
      <TopBarMenu />
      <Stack
        flex={1}
        spacing={[3, 4]}
        direction={'row'}
        alignItems={'center'}
        justifyContent={'flex-end'}
      >
        {assetBalance}
        <NetworkSelector />
        <AccountSelector />
        {/*<NotificationList />*/}
      </Stack>
    </HStack>
  )
}

import React, { useMemo } from 'react'
import { NavLink } from "react-router-dom"
import { TopBarMenu } from './Menu/TopBarMenu'
import { HStack, Stack } from '@chakra-ui/react'
import { selectUnderlyingToken } from 'selectors/'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { useWalletProvider } from 'contexts/WalletProvider'
// import { useThemeProvider } from 'contexts/ThemeProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

export const Header: React.FC = () => {
  // const { screenSize } = useThemeProvider()
  const { chainId, account } = useWalletProvider()

  const assetBalance = useMemo(() => {
    if (!account?.address) return null
    const idleToken = selectUnderlyingToken(chainId, 'IDLE')
    return (
      <NavLink
        to={'stake'}
      >
        <AssetProvider
          assetId={idleToken?.address}
        >
          <HStack
            spacing={0}
            width={'100%'}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'xs'} mr={2} />
            <AssetProvider.Balance decimals={2} textStyle={'cta'} />
          </HStack>
        </AssetProvider>
      </NavLink>
    )
  }, [account, chainId])

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

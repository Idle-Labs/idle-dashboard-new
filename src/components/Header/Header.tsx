import React, { useMemo } from 'react'
import { NavLink } from "react-router-dom"
import { Card } from 'components/Card/Card'
import { TopBarMenu } from './Menu/TopBarMenu'
import { selectUnderlyingToken } from 'selectors/'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { useWalletProvider } from 'contexts/WalletProvider'
// import { useThemeProvider } from 'contexts/ThemeProvider'
import { HStack, Stack, VStack, Image } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
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
    <VStack
      spacing={5}
      width={'full'}
    >
      <HStack
        spacing={0}
        width={'full'}
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
      <Card.Dark
        p={[3, 5]}
        borderColor={'yellow'}
      >
        <Stack
          width={'full'}
          spacing={[2, 3]}
          alignItems={'center'}
          justifyContent={'center'}
          direction={['column','row']}
        >
          <Image src={`images/vaults/deprecated.png`} width={6} />
          <Translation textAlign={'center'} translation={'announcements.eulerHack'} isHtml={true} textStyle={'caption'} />
          <Image display={['none', 'block']} src={`images/vaults/deprecated.png`} width={6} />
        </Stack>
      </Card.Dark>
    </VStack>
  )
}

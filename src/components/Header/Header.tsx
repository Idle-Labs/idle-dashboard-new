import React, { useMemo } from 'react'
import { NavLink } from "react-router-dom"
import { TopBarMenu } from './Menu/TopBarMenu'
import { GOVERNANCE_CHAINID } from 'constants/'
import { selectUnderlyingToken } from 'selectors/'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { HStack, Stack, VStack } from '@chakra-ui/react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { PointsCampaignBadge } from './PointsCampaign'

export const Header: React.FC = () => {
  const { account } = useWalletProvider()

  const assetBalance = useMemo(() => {
    if (!account?.address) return null
    const idleToken = selectUnderlyingToken(GOVERNANCE_CHAINID, 'IDLE')
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
  }, [account])

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
          <PointsCampaignBadge />
          <NetworkSelector />
          <AccountSelector />
          {/*<NotificationList />*/}
        </Stack>
      </HStack>
      {/*<EulerHackBanner />*/}
    </VStack>
  )
}

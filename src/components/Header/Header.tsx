import React, { useMemo } from 'react'
import { TopBarMenu } from './Menu/TopBarMenu'
import { selectUnderlyingToken } from 'selectors/'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { NotificationList } from './NotificationList'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { useWalletProvider } from 'contexts/WalletProvider'
import { ContainerProps, Flex, Stack } from '@chakra-ui/react'

export const Header: React.FC<ContainerProps> = ({ children, ...rest }) => {

  const { chainId, account } = useWalletProvider()

  const assetBalance = useMemo(() => {
    if (!account?.address) return null
    const idleToken = selectUnderlyingToken(chainId, 'IDLE')
    return (
      <AssetProvider assetId={idleToken?.address}>
        <Flex
          width={'100%'}
          alignItems={'center'}
        >
          <AssetProvider.Icon size={'xs'} mr={2} />
          <AssetProvider.Balance textStyle={'cta'} />
        </Flex>
      </AssetProvider>
    )
  }, [account, chainId])

  return (
    <Flex
      direction={'row'}
      justifyContent={'space-between'}
    >
      <TopBarMenu />
      <Stack
        spacing={3}
        width={'50%'}
        direction={'row'}
        alignItems={'center'}
        justifyContent={'flex-end'}
      >
        {assetBalance}
        <NetworkSelector />
        <AccountSelector />
        <NotificationList />
      </Stack>
    </Flex>
  )
}

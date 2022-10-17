import React from 'react'
import { TopBarMenu } from './Menu/TopBarMenu'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { NotificationList } from './NotificationList'
import { AssetCell } from 'components/AssetCell/AssetCell'
import { ContainerProps, Flex, Stack } from '@chakra-ui/react'

export const Header: React.FC<ContainerProps> = ({ children, ...rest }) => {
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
        <AssetCell assetId={'0x875773784Af8135eA0ef43b5a374AaD105c5D39e'}>
          <Flex
            width={'100%'}
            alignItems={'center'}
          >
            <AssetCell.Icon size={'xs'} mr={2} />
            <AssetCell.Balance textStyle={'cta'} />
          </Flex>
        </AssetCell>
        <NetworkSelector />
        <AccountSelector />
        <NotificationList />
      </Stack>
    </Flex>
  )
}

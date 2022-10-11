import React from 'react'
import { TopBarMenu } from './Menu/TopBarMenu'
import { NetworkSelector } from './NetworkSelector'
import { AccountSelector } from './AccountSelector'
import { NotificationList } from './NotificationList'
import { ContainerProps, Flex, Stack } from '@chakra-ui/react'

export const Header: React.FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <Flex
      direction={'row'}
      justifyContent={'space-between'}
    >
      <TopBarMenu />
      <Stack
        spacing={4}
        direction={'row'}
        alignItems={'center'}
      >
        <NetworkSelector />
        <AccountSelector />
        <NotificationList />
      </Stack>
    </Flex>
  )
}

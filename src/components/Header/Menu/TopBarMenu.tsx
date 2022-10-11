import React from 'react'
import { menu } from 'constants/menu'
import { MenuNavItem } from './MenuNavItem'
import { Menu, Flex, Stack } from '@chakra-ui/react'
import { MenuItemExpandable } from './MenuItemExpandable'

export const TopBarMenu: React.FC = () => {
  return (
    <Stack
      height={'40px'}
      spacing={'40px'}
      direction={'row'}
      alignItems={'center'}
    >
      <Menu>
        {({ isOpen }) => menu.map( (menuItem, index) => {
          return (
            <Flex
              key={`menuItem_${index}`}
            >
              {
                menuItem.children ? (
                  <MenuItemExpandable isOpen={isOpen} menuItem={menuItem} />
                ) : (
                  <MenuNavItem {...menuItem} />
                )
              }
            </Flex>
          )
        })
      }
      </Menu>
    </Stack>
  )
}

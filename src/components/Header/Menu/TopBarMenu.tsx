import React from 'react'
import { menu } from 'constants/menu'
import { MenuNavItem } from './MenuNavItem'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { MenuItemExpandable } from './MenuItemExpandable'
import { Menu, Flex, HStack, Image } from '@chakra-ui/react'

export const TopBarMenu: React.FC = () => {
  const { screenSize } = useThemeProvider()
  return (
    <HStack
      height={10}
      spacing={10}
      alignItems={'center'}
    >
      <Image src={'images/icon.svg'} height={[8, 10]} width={[8, 10]} />
      {
        screenSize !== 'sm' && (
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
        )
      }
    </HStack>
  )
}

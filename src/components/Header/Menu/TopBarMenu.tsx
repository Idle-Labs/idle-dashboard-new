import { menu } from 'constants/menu'
import React, { useState } from 'react'
import { MdMenu } from 'react-icons/md'
import { MobileMenu } from './MobileMenu'
import { MenuNavItem } from './MenuNavItem'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { MenuItemExpandable } from './MenuItemExpandable'
import { Menu, Flex, HStack, Image } from '@chakra-ui/react'

export const TopBarMenu: React.FC = () => {
  const { screenSize } = useThemeProvider()
  const isMobile = screenSize === 'sm'
  const [ mobileMenuOpened, setMobileMenuOpened ] = useState<boolean>(true)
  return (
    <HStack
      height={10}
      alignItems={'center'}
      spacing={isMobile ? 4 :10}
    >
      {
        isMobile && (
          <MdMenu onClick={() => setMobileMenuOpened(true)} size={32} />
        )
      }
      <Image src={'images/icon.svg'} height={[8, 10]} width={[8, 10]} />
      {
        !isMobile ? (
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
        ) : (
          <MobileMenu isOpen={mobileMenuOpened} close={() => setMobileMenuOpened(false)} />
        )
      }
    </HStack>
  )
}

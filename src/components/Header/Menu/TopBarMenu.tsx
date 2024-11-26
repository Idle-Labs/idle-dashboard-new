import { MdMenu } from 'react-icons/md'
import { MobileMenu } from './MobileMenu'
import { MenuNavItem } from './MenuNavItem'
import { checkMenuItemEnv, checkSectionEnabled } from 'helpers/'
import { menu, MenuItemType } from 'constants/menu'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { MenuItemExpandable } from './MenuItemExpandable'
import React, { useState, useMemo, useEffect } from 'react'
import { Menu, Flex, HStack, Image } from '@chakra-ui/react'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'

export const TopBarMenu: React.FC = () => {
  const { location } = useBrowserRouter()
  const { screenSize, setScrollLocked, environment } = useThemeProvider()
  const [ mobileMenuOpened, setMobileMenuOpened ] = useState<boolean>(true)

  const isMobile = useMemo(() => screenSize === 'sm', [screenSize])

  // Automatically close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpened(false)
  }, [location])

  // Lock scroll if mobile menu opened
  useEffect(() => {
    setScrollLocked(isMobile && mobileMenuOpened)
  }, [mobileMenuOpened, isMobile, setScrollLocked])

  const enabledMenuItems = useMemo(() => {
    return menu.filter( menuItem => checkMenuItemEnv(menuItem, environment) ).filter( (menuItem: MenuItemType) => !menuItem.path || checkSectionEnabled(menuItem.path as string, environment) )
  }, [environment])

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
      <Image src={'images/idle-institutional.svg'} height={[8, 10]} />
      {
        !isMobile ? (
          <Menu>
            {({ isOpen }) => enabledMenuItems.map( (menuItem: MenuItemType, index) => {
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

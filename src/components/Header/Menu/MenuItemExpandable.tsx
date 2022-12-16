import React, { useMemo } from 'react'
import { Icon } from 'components/Icon/Icon'
import { useNavigate } from 'react-router-dom'
import type { MenuItemType } from 'constants/menu'
import { MenuNavItem, NavItemText } from './MenuNavItem'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md'
import { MenuButton, Flex, MenuList, MenuItem, useTheme, IconButton } from '@chakra-ui/react'

type MenuItemExpandableProps = {
  isOpen: boolean
  isMobile?: boolean
  menuItem: MenuItemType
}

export const MenuItemExpandable: React.FC<MenuItemExpandableProps> = ({
  isOpen,
  isMobile = false,
  menuItem
}) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const menuButton = useMemo(() => {
    return isMobile ? (
      <MenuButton as={IconButton} variant={'cta'} icon={<Icon IconComponent={menuItem?.icon as string} height={'24px'} />} />
    ) : (
      <MenuButton as={Flex} style={{cursor:'pointer'}}>
        <Flex
          direction={'row'}
          alignItems={'center'}
        > 
          <NavItemText isActive={isOpen} {...menuItem} />
          {
            menuItem.children && menuItem.children.length>0 && (
              <Flex
                width={'24px'}
              >
              {
                isOpen ? (
                  <MdKeyboardArrowUp
                    size={24}
                    color={theme.colors.cta}
                  />
                ) : (
                  <MdKeyboardArrowDown
                    size={24}
                    color={theme.colors.cta}
                  />
                )
              }
              </Flex>
            )
          }
        </Flex>
      </MenuButton>
    )
  }, [isMobile, isOpen, menuItem, theme.colors.cta])

  return (
    <>
      {menuButton}
      {
        menuItem.children && menuItem.children.length>0 && (
          <MenuList>
            {
              menuItem.children.map( (menuItem, index) => (
                <MenuItem
                  key={`menuItem_${index}`}
                  // onClick={ () => { menuItem.onClick && menuItem.onClick() } }
                  onClick={ () => { menuItem.onClick ? menuItem.onClick() : (menuItem.path && navigate(menuItem.path))} }
                >
                  <MenuNavItem {...menuItem} />
                </MenuItem>
              ))
            }
          </MenuList>
        )
      }
    </>
  )
}
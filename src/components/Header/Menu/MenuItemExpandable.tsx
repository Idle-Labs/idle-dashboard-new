import React from 'react'
import {
  MenuButton,
  Flex,
  MenuList,
  MenuItem,
  useTheme
} from '@chakra-ui/react'
import { MenuNavItem, NavItemText } from './MenuNavItem'
import type { MenuItemType } from '../../../constants/menu'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md'

type MenuItemExpandableProps = {
  isOpen: boolean
  menuItem: MenuItemType
}

export const MenuItemExpandable: React.FC<MenuItemExpandableProps> = (props) => {
  const theme = useTheme()
  return (
    <>
      <MenuButton as={Flex} style={{cursor:'pointer'}}>
        <Flex
          direction={'row'}
          alignItems={'center'}
        > 
          <NavItemText isActive={props.isOpen} {...props.menuItem} />
          <Flex
            width={'24px'}
          >
          {
            props.isOpen ? (
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
        </Flex>
      </MenuButton>
      {
        props.menuItem.children && (
          <MenuList>
            {
              props.menuItem.children.map( (menuItem, index) => (
                <MenuItem
                  key={`menuItem_${index}`}
                  onClick={ () => { menuItem.onClick && menuItem.onClick() } }
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
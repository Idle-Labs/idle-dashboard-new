import React from 'react'
import { NavLink } from "react-router-dom";
import { MdKeyboardArrowDown } from 'react-icons/md'
import { ContainerProps, Stack, Flex, Text } from '@chakra-ui/react'

import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  // MenuItemOption,
  // MenuGroup,
  // MenuOptionGroup,
  // MenuDivider,
} from '@chakra-ui/react'

export const Header: React.FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <Stack

      spacing={'40px'}
      direction={'row'}
    >
      <NavLink
        to={'dashboard'}
      >
        <Text textStyle={'cta'}>Dashboard</Text>
      </NavLink>
      <Menu>
        <MenuButton as={NavLink} to={'earn'}>
          <Flex
            alignItems={'center'}
            direction={'row'}
          >
            Earn
            <MdKeyboardArrowDown
              size={24}
            />
          </Flex>
        </MenuButton>
        <MenuList>
          <MenuItem>
            <NavLink
              to={'earn/best-yield'}
            >
              Best Yield
            </NavLink>
          </MenuItem>
          <MenuItem>
            <NavLink
              to={'earn/protected-yield'}
            >
              Protected Yield
            </NavLink>
          </MenuItem>
          <MenuItem>
            <NavLink
              to={'earn/boosted-yield'}
            >
              Boosted Yield
            </NavLink>
          </MenuItem>
        </MenuList>
      </Menu>
      <NavLink
        to={'stats'}
      >
        Stats
      </NavLink>
      <NavLink
        to={'Stake'}
      >
        Stake & Vote
      </NavLink>
      <NavLink
        to={'governance'}
      >
        Governance
      </NavLink>
    </Stack>
  )
}

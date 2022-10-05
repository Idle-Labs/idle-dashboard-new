import React from 'react'
import { Icon } from '../../Icon/Icon'
import { NavLink } from "react-router-dom"
import { Text, Flex, useTheme } from '@chakra-ui/react'
import type { MenuItemType } from '../../../constants/menu'

type NavItemTextProps = {
  isActive?: boolean
  [x: string]: any
}

export const NavItemText:React.FC<NavItemTextProps> = ({isActive, ...props}) => {
  const theme = useTheme()
  const MenuItemIcon = props.icon
  return (
    <>
      {
        MenuItemIcon && (
          <Flex
            mr={1}
          >
            <Icon IconComponent={MenuItemIcon} color={isActive ? theme.colors.primary : theme.colors.cta} width={6} height={6} size={'24px'} {...props.iconProps}/>
          </Flex>
        )
      }
      <Text textStyle={'cta'} sx={isActive ? {color:'primary'} : {}} {...props.labelProps}>{props.label}</Text>
    </>
  )
}

export const MenuNavItem:React.FC<MenuItemType> = (props) => {
  return props.path ? (
    <NavLink
      to={props.path}
    >
      {({ isActive }) => (
        <NavItemText isActive={isActive} {...props} />
      )}
    </NavLink>
  ) : (
    <NavItemText {...props} />
  )
}
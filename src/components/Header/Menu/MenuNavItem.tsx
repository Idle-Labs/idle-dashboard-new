import React from 'react'
import { NavLink } from "react-router-dom"
import { Icon } from 'components/Icon/Icon'
import { useTheme } from '@chakra-ui/react'
import type { MenuItemType } from 'constants/menu'
import { Translation } from 'components/Translation/Translation'

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
          <Icon IconComponent={MenuItemIcon} color={isActive ? theme.colors.primary : theme.colors.cta} mr={1} width={6} height={6} size={'24px'} {...props.iconProps}/>
        )
      }
      <Translation translation={props.label} textStyle={'cta'} sx={isActive ? {color:'primary'} : {}} {...props.labelProps}></Translation>
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
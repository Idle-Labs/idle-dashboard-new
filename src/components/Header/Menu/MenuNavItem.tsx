import React from 'react'
import { NavLink } from "react-router-dom"
import { Icon } from 'components/Icon/Icon'
import { MdOpenInNew } from 'react-icons/md'
import type { MenuItemType } from 'constants/menu'
import { useTheme, Box, HStack, Link } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type NavItemTextProps = {
  isActive?: boolean
  [x: string]: any
}

export const NavItemText:React.FC<NavItemTextProps> = ({isActive, ...props}) => {
  const theme = useTheme()
  const MenuItemIcon = props.icon
  return (
    <HStack
      spacing={2}
    >
      <Translation translation={props.label} textStyle={'cta'} sx={isActive ? {color:'primary'} : {}} {...props.labelProps}></Translation>
      {
        MenuItemIcon && (
          <Icon IconComponent={MenuItemIcon} color={isActive ? theme.colors.primary : theme.colors.cta} width={6} height={6} size={'24px'} {...props.iconProps}/>
        )
      }
      {
        props.color && (
          <Box
            width={2}
            height={2}
            borderRadius={'50%'}
            bg={props.color}
          >
          </Box>
        )
      }
    </HStack>
  )
}

export const MenuNavItem:React.FC<MenuItemType> = (props) => {
  const theme = useTheme()

  return props.path ? (
    <NavLink
      to={props.path}
    >
      {({ isActive }) => (
        <NavItemText isActive={isActive} {...props} />
      )}
    </NavLink>
  ) : props.link ? (
    <Link href={props.link} isExternal textDecoration={'none !important'}>
      <HStack
        spacing={1}
      >
        <Translation translation={props.label} textStyle={'cta'} {...props.labelProps}></Translation>
        <MdOpenInNew color={theme.colors.cta} />
      </HStack>
    </Link>
  ) : (
    <NavItemText {...props} />
  )
}
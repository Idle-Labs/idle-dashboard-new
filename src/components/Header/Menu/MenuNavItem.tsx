import React, { useMemo } from 'react'
import { NavLink } from "react-router-dom"
import { Icon } from 'components/Icon/Icon'
import { MdOpenInNew } from 'react-icons/md'
import type { MenuItemType } from 'constants/menu'
import { useTheme, Box, HStack, Link } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type NavItemTextProps = {
  isActive?: boolean
} & MenuItemType

export const NavItemText:React.FC<NavItemTextProps> = ({isActive, ...props}) => {
  const theme = useTheme()
  const iconPosition = props.iconPosition || 'left'

  const iconElement = useMemo(() => {
    return props.icon && (
      <Icon IconComponent={props.icon} color={isActive ? theme.colors.primary : theme.colors.cta} width={6} height={6} size={'24px'} {...props.iconProps}/>
    )
  }, [isActive, theme, props])

  return (
    <HStack
      spacing={2}
    >
      {iconPosition === 'left' && iconElement}
      <Translation translation={props.label} textStyle={'cta'} sx={isActive ? {color:'primary'} : {}} {...props.labelProps}></Translation>
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
      {iconPosition === 'right' && iconElement}
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
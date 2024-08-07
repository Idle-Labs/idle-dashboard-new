import { useMemo } from 'react'
import { ENVIRONMENTS_HOSTNAMES } from 'constants/vars'
import type { ProviderProps } from './common/types'
import React, { useContext, useState } from 'react'
import { useTheme, useMediaQuery } from "@chakra-ui/react"

type ContextProps = {
  theme: any
  scrollLocked: boolean
  screenSize: string | null
  setScrollLocked: Function
  isMobile: boolean
  environment: string
}

const initialState: ContextProps = {
  theme: null,
  isMobile: false,
  screenSize: null,
  environment: 'prod',
  scrollLocked: false,
  setScrollLocked: () => {}
}

const ThemeProviderContext = React.createContext<ContextProps>(initialState)
export const useThemeProvider = () => useContext(ThemeProviderContext)

export function ThemeProvider({ children }: ProviderProps) {
  const theme = useTheme()
  const { breakpoints } = theme
  const [ scrollLocked, setScrollLocked ] = useState<boolean>(false)
  const environment = useMemo(() =>  ENVIRONMENTS_HOSTNAMES[window.location.hostname.toLowerCase()] || 'beta', [])

  const [isSmall] = useMediaQuery(`(min-width: ${breakpoints.base}) and (max-width: ${breakpoints.sm})`)
  const [isMedium] = useMediaQuery(`(min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`)
  const [isLarge] = useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`)
  const [isExtraLarge] = useMediaQuery(`(min-width: ${breakpoints.lg})`)

  const screenSize = isSmall ? 'sm' : (isMedium ? 'md' : (isLarge ? 'lg' : (isExtraLarge ? 'xl' : 'xxl')))
  const isMobile = screenSize === 'sm'

  return (
    <ThemeProviderContext.Provider value={{theme, screenSize, scrollLocked, setScrollLocked, isMobile, environment}}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
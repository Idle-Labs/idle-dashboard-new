import type { ProviderProps } from './common/types'
import { useTheme, useMediaQuery } from "@chakra-ui/react"
import React, { useContext, useEffect, useState } from 'react'

type ContextProps = {
  scrollLocked: boolean
  screenSize: string | null
  setScrollLocked: Function
}

const initialState: ContextProps = {
  screenSize: null,
  scrollLocked: false,
  setScrollLocked: () => {}
}

const ThemeProviderContext = React.createContext<ContextProps>(initialState)
export const useThemeProvider = () => useContext(ThemeProviderContext)

export function ThemeProvider({ children }: ProviderProps) {
  const { breakpoints } = useTheme()
  const [ scrollLocked, setScrollLocked ] = useState<boolean>(false)

  const [isSmall] = useMediaQuery(`(min-width: ${breakpoints.base}) and (max-width: ${breakpoints.sm})`)
  const [isMedium] = useMediaQuery(`(min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`)
  const [isLarge] = useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`)
  const [isExtraLarge] = useMediaQuery(`(min-width: ${breakpoints.lg})`)

  const screenSize = isSmall ? 'sm' : (isMedium ? 'md' : (isLarge ? 'lg' : (isExtraLarge ? 'xl' : 'xxl')))

  return (
    <ThemeProviderContext.Provider value={{screenSize, scrollLocked, setScrollLocked}}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
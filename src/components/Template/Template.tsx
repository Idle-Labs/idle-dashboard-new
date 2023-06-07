import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from 'components/Header/Header'
import { ContainerProps, Box } from '@chakra-ui/react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { WrongNetworkBanner } from 'components/WrongNetworkBanner/WrongNetworkBanner'

export const Template: React.FC<ContainerProps> = () => {
  const { location } = useBrowserRouter()
  const { scrollLocked, isMobile } = useThemeProvider()

  let className = location?.pathname.replace(/\//g,'-').replace(/^-/,'')
  // let className = params.strategy ? `earn-${params.strategy}` : location?.pathname.replace(/\//g,'-').replace(/^-/,'')
  if (isMobile){
    className += ' mobile'
  }

  return (
    <Box
      id={'body'}
      width={'100%'}
      minH={'100vh'}
      overflowX={'hidden'}
      position={'absolute'}
      className={className}
      height={scrollLocked ? '100vh' : 'auto'}
      overflowY={scrollLocked ? 'hidden' : 'visible'}
    >
      <Box
        my={[4, 10]}
        mx={[4, 20]}
      >
        <Header />
        <Suspense>
          <Outlet />
        </Suspense>
      </Box>
      <WrongNetworkBanner />
    </Box>
  )
}

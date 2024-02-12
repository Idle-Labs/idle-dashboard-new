import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from 'components/Footer/Footer'
import { Header } from 'components/Header/Header'
import { AUTHWALL_ENABLED } from 'constants/vars'
import { AuthWall } from 'components/AuthWall/AuthWall'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { ContainerProps, Box, VStack } from '@chakra-ui/react'
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
      minH={'100vh'}
      width={'full'}
      display={'flex'}
      overflowX={'hidden'}
      position={'absolute'}
      className={className}
      height={scrollLocked ? '100vh' : 'auto'}
      overflowY={scrollLocked ? 'hidden' : 'visible'}
    >
      <VStack
        spacing={0}
        py={[4, 10]}
        px={[4, 20]}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Header />
        {
          AUTHWALL_ENABLED ? (
            <AuthWall>
              <Suspense>
                <Outlet />
              </Suspense>
            </AuthWall>
          ) : (
            <Box
              width={'full'}
            >
              <Suspense>
                <Outlet />
              </Suspense>
            </Box>
          )
        }
        <Box
          pt={[10, 20]}
          width={'full'}
        >
          <Footer />
        </Box>
      </VStack>
      <WrongNetworkBanner />
    </Box>
  )
}

import React from 'react'
import { Header } from 'components/Header/Header'
import { Outlet, redirect } from 'react-router-dom'
import { ContainerProps, Box } from '@chakra-ui/react'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'

export const Template: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { location, match } = useBrowserRouter()
  const className = location?.pathname.replace(/\//g,'-').replace(/^-/,'')

  return (
    <Box
      width={'100%'}
      minH={'100vh'}
      overflowX={'hidden'}
      position={'absolute'}
      className={className}
    >
      <Box
        my={10}
        mx={20}
      >
        <Header />
        <Outlet />
      </Box>
    </Box>
  )
}

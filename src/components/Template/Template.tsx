import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from 'components/Header/Header'
import { ContainerProps, Box } from '@chakra-ui/react'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'

export const Template: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { location } = useBrowserRouter()
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
        my={[4, 10]}
        mx={[4, 20]}
      >
        <Header />
        <Outlet />
      </Box>
    </Box>
  )
}

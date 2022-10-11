import React from 'react'
import { Header } from '../Header/Header'
import { Outlet } from 'react-router-dom'
import { ContainerProps, Box } from '@chakra-ui/react'

export const Template: React.FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <Box
      my={10}
      mx={20}
    >
      <Header />
      <Outlet />
    </Box>
  )
}

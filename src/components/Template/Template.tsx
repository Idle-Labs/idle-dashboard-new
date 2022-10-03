import React from 'react'
import { Header } from '../Header/Header'
import { ContainerProps } from '@chakra-ui/react'

export const Template: React.FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <>
      <Header />
    </>
  )
}

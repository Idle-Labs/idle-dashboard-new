import React from 'react'
import { ContainerProps } from '@chakra-ui/react'

export const TestComponent: React.FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <div>TestComponent</div>
  )
}
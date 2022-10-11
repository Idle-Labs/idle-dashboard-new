import React from 'react'
import { ContainerProps, Box } from '@chakra-ui/react'

export const Scrollable: React.FC<ContainerProps> = ({children, ...props}) => {
  return (
    <Box
      {...props}
      overflow={'scroll'}
    >
      {children}
    </Box>
  )
}
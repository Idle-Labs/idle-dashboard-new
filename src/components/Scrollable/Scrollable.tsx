import React from 'react'
import { FlexProps, Flex } from '@chakra-ui/react'

type ScrollableArgs = {
  parentRef?: any
} & FlexProps

export const Scrollable: React.FC<ScrollableArgs> = ({children, ...flexProps}) => {
  return (
    <Flex
      flex={1}
      width={'100%'}
      overflowY={'auto'}
      overflowX={'hidden'}
      direction={'column'}
      alignItems={'flex-start'}
      {...flexProps}
    >
      {children}
    </Flex>
  )
}
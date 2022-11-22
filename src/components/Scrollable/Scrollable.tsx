import React from 'react'
import { FlexProps, Flex } from '@chakra-ui/react'

type ScrollableArgs = {
  parentRef?: any
} & FlexProps

export const Scrollable: React.FC<ScrollableArgs> = ({parentRef, children, ...flexProps}) => {
  return (
    <Flex
      flex={1}
      width={'100%'}
      overflow={'scroll'}
      direction={'column'}
      alignItems={'flex-start'}
      {...flexProps}
    >
      {children}
    </Flex>
  )
}
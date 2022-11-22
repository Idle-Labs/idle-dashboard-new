import React, { useRef } from 'react'
import { ContainerProps, Box, Flex, useDimensions } from '@chakra-ui/react'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect";

type ScrollableArgs = {
  parentRef?: any
} & ContainerProps

export const Scrollable: React.FC<ScrollableArgs> = ({parentRef, children, ...props}) => {
  // const containerRef = useRef() as React.MutableRefObject<HTMLDivElement>;
  // const dimensions = useDimensions(containerRef)
  // console.log('dimensions', containerRef, dimensions)
  return (
    <Flex
      flex={1}
      width={'100%'}
      // ref={containerRef}
      overflow={'scroll'}
      direction={'column'}
      alignItems={'flex-start'}
      {...props}
    >
      {children}
    </Flex>
  )
}
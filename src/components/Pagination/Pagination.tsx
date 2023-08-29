import React from 'react'
import { MdArrowBackIosNew, MdArrowForwardIos } from 'react-icons/md'
import { Flex, HStack, Button, Text, FlexProps } from '@chakra-ui/react'

export type PaginationArgs = {
  onPrevArrowClick: React.MouseEventHandler<HTMLElement>
  onNextArrowClick: React.MouseEventHandler<HTMLElement>
  prevArrowColor: string
  nextArrowColor: string
  activePage: number
  pages: number
} & FlexProps

export const Pagination: React.FC<PaginationArgs> = ({
  onPrevArrowClick,
  onNextArrowClick,
  prevArrowColor,
  nextArrowColor,
  activePage,
  pages,
  ...props
}) => {
  return (
    <Flex
      width={'100%'}
      alignItems={'center'}
      justifyContent={'flex-end'}
      {...props}
    >
      <HStack
        spacing={2}
      >
        <Button variant={'link'} minW={'auto'} onClick={onPrevArrowClick}>
          <MdArrowBackIosNew color={prevArrowColor} />
        </Button>
        <Text textStyle={'ctaStatic'}>{activePage}/{pages}</Text>
        <Button variant={'link'} minW={'auto'} onClick={onNextArrowClick}>
          <MdArrowForwardIos color={nextArrowColor} />
        </Button>
      </HStack>
    </Flex>
  )
}
import React from 'react'
import { HStack, Flex, Text } from '@chakra-ui/react'
import { MdOutlineClose, MdKeyboardArrowLeft } from 'react-icons/md'
import { TranslationProps, Translation } from 'components/Translation/Translation'

type NavBarProps = {
  height?: string
  goBack?: Function
  close?: Function
} & TranslationProps

export const NavBar: React.FC<NavBarProps> = ({ goBack, close, height, ...props }) => {
  return (
    <HStack
      width={'100%'}
      position={'relative'}
      alignItems={'center'}
      height={height || '24px'}
      justifyContent={'flex-start'}
    >
      {
        goBack && (
          <Flex
            zIndex={1}
            position={'relative'}
          >
            <MdKeyboardArrowLeft
              size={24}
              onClick={() => goBack()}
              style={{cursor:'pointer'}}
            />
          </Flex>
        )
      }
      <Flex
        zIndex={0}
        width={'100%'}
        justifyContent={'center'}
        position={goBack ? 'absolute' : 'relative'}
      >
        <Translation component={Text} textStyle={'ctaStatic'} aria-selected={true} {...props} />
      </Flex>
      {
        close && (
          <Flex
            top={0}
            right={0}
            zIndex={1}
            position={'absolute'}
          >
            <MdOutlineClose
              size={24}
              onClick={() => close()}
              style={{cursor: 'pointer'}}
            />
          </Flex>
        )
      }
    </HStack>
  )
}
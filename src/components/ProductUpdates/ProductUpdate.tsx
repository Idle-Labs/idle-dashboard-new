import React from 'react'
import { IconType } from 'constants/types'
import { Icon } from 'components/Icon/Icon'
import { VStack, HStack, Text } from '@chakra-ui/react'

type ProductUpdateArgs = {
  title: string
  text: string
  date: string
  icon?: IconType
}

export const ProductUpdate: React.FC<ProductUpdateArgs> = (props) => {
  return (
    <VStack
      pb={4}
      mb={4}
      width={'100%'}
      alignItems={'flex-start'}
      borderBottomWidth={'1px'}
      borderBottomColor={'divider'}
    >
      <HStack
        mb={2}
        width={'100%'}
        justifyContent={'space-between'}
      >
        <HStack
          spacing={3}
          direction={'row'}
          alignItems={'center'}
        >
          {props.icon && <Icon IconComponent={props.icon} width={24} height={24} size={24} />}
          <Text textStyle={'bodyTitle'} whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} maxW={200}>{props.title}</Text>
        </HStack>
        <Text fontWeight={600} textStyle={'captionSmall'}>{props.date}</Text>
      </HStack>
      <Text maxH={45} overflow={'hidden'} textStyle={'captionSmall'}>
        {props.text}
      </Text>
    </VStack>
  )
}
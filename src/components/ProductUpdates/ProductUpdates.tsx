import React from 'react'
import { IconType } from 'constants/types'
import { Icon } from 'components/Icon/Icon'
import { Card } from 'components/Card/Card'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Flex, VStack, HStack, Text } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type ProductUpdateArgs = {
  title: string
  text: string
  date: string
  icon?: IconType
}

const ProductUpdate: React.FC<ProductUpdateArgs> = (props) => {
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

export const ProductUpdates: React.FC = () => {
  return (
    <Card
      flex={1}
    >
      <VStack
        flex={1}
        spacing={0}
        height={'100%'}
        alignItems={'flex-start'}
        justifyContent={'flex-start'}
      >
        <Translation component={Card.Heading} translation={'dashboard.productUpdates.title'} />
        <Scrollable maxH={550}>
          <Flex
            flex={1}
            minH={400}
            width={'100%'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Translation component={Text} translation={'dashboard.productUpdates.empty'} />
          </Flex>
        </Scrollable>
      </VStack>
    </Card>
  )
}
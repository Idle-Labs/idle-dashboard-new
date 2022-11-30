import React from 'react'
import { Card } from 'components/Card/Card'
import { ProductUpdate } from './ProductUpdate'
import { Flex, VStack, Text } from '@chakra-ui/react'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Translation } from 'components/Translation/Translation'

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
import React from 'react'
import { IconType } from 'constants/types'
import { Icon } from 'components/Icon/Icon'
import { Card } from 'components/Card/Card'
import { VStack, HStack, Text } from '@chakra-ui/react'
import { Scrollable } from 'components/Scrollable/Scrollable'
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
        spacing={6}
        height={'100%'}
        alignItems={'flex-start'}
        justifyContent={'flex-start'}
      >
        <Translation component={Card.Heading} translation={'dashboard.productsUpdates.title'} />
        <Scrollable maxH={'500px'}>
          <ProductUpdate
            title={'This is the title'}
            date={'21/11/2022'}
            text={'A new product update has been released! Navigate to discover...'}
          />
          <ProductUpdate
            title={'This is the title'}
            date={'21/11/2022'}
            text={'A new product update has been released! Navigate to discover...'}
          />
          {
            /*
            <ProductUpdas
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            <ProductUpdate
              title={'This is the title'}
              date={'21/11/2022'}
              text={'A new product update has been released! Navigate to discover...'}
            />
            */
          }
        </Scrollable>
      </VStack>
    </Card>
  )
}
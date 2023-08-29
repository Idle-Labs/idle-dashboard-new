import React from 'react'
import { Card } from 'components/Card/Card'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { Flex, HStack, Heading } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type DashboardNewsBannerProps = {
  announcement: string
  onClick?: React.MouseEventHandler<HTMLElement> | Function
}

export const DashboardNewsBanner: React.FC<DashboardNewsBannerProps> = ({
  announcement,
  onClick
}) => {
  return (
    <Card.Flex
      h={'140px'}
      width={'full'}
      borderRadius={16}
      alignItems={'center'}
      justifyContent={'center'}
    >
      <HStack
        pl={20}
        px={10}
        width={'full'}
        justifyContent={'space-between'}
      >
        <Translation translation={`announcements.${announcement}.title`} component={Heading} as={'h3'} fontSize={'h3'} />
        <HStack
          spacing={1}
        >
          <Translation translation={`announcements.${announcement}.cta`} textStyle={'ctaStatic'} />
          <MdKeyboardArrowRight size={24} />
        </HStack>
      </HStack>
    </Card.Flex>
  )
}
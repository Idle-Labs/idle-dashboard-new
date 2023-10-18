import React from 'react'
import { Card } from 'components/Card/Card'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { Stack, HStack, Heading } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type DashboardNewsBannerProps = {
  banner?: string
  announcement: string
  hasBackgroundImage?: boolean
  onClick?: React.MouseEventHandler<HTMLElement> | Function
}

export const DashboardNewsBanner: React.FC<DashboardNewsBannerProps> = ({
  banner,
  announcement,
  hasBackgroundImage = true,
  onClick
}) => {
  return (
    <Card.Flex
      h={'140px'}
      width={'full'}
      borderRadius={8}
      alignItems={'center'}
      backgroundSize={'cover'}
      justifyContent={'center'}
      backgroundPosition={'center'}
      backgroundImage={hasBackgroundImage ? `url(images/banners/${banner || announcement}-bg.png)` : 'none'}
    >
      <Stack
        px={[5, 10]}
        pl={[0, 20]}
        width={'full'}
        direction={['column', 'row']}
        justifyContent={'space-between'}
      >
        <Translation translation={`announcements.${announcement}.title`} component={Heading} as={'h3'} fontSize={'h3'} />
        <HStack
          spacing={1}
        >
          <Translation translation={`announcements.${announcement}.cta`} textStyle={['ctaStatic', 'clickable']} sx={{':hover':{textDecoration:'underline'}}} onClick={onClick} />
          <MdKeyboardArrowRight size={24} />
        </HStack>
      </Stack>
    </Card.Flex>
  )
}
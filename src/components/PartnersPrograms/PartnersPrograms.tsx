import React, { useMemo } from 'react'
import { Translation } from 'components/Translation/Translation'
import { VStack, HStack, Image, Link, LinkProps } from '@chakra-ui/react'

export const PartnersPrograms: React.FC = () => {
  const partnerPrograms: Record<string, any> = useMemo(() => ({
    institutions: {
      url: "https://docs.idle.finance/products/get-involved/institutions-program"
    },
    integrators: {
      url: "https://docs.idle.finance/products/get-involved/integrators-program"
    }
  }), [])

  return (
    <VStack
      spacing={4}
      width={'full'}
    >
      {
        Object.keys(partnerPrograms).map( (program, index) => (
          <VStack
            pb={4}
            spacing={6}
            width={'full'}
            alignItems={'flex-start'}
            borderBottom={index<Object.keys(partnerPrograms).length-1 ? '1px solid' : 'none'}
            borderColor={'divider'}
          >
            <HStack
              alignItems={'center'}
            >
              <Image src={`images/partners/${program}.png`} width={16} height={16} />
              <Translation isHtml translation={`partnerPrograms.${program}.title`} textStyle={'ctaStatic'} />
            </HStack>
            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation translation={`partnerPrograms.${program}.body`} textStyle={'captionSmall'} />
              <Translation<LinkProps> href={partnerPrograms[program].url} component={Link} isExternal translation={`common.readMore`} textStyle={['cta', 'linkBlue']} fontSize={'sm'} />
            </VStack>
          </VStack>
        ))
      }
    </VStack>
  )
}
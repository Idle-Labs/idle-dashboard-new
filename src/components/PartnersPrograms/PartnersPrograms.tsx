import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { Translation } from 'components/Translation/Translation'
import { SimpleGrid, VStack, HStack, Image, Link, Heading, LinkProps } from '@chakra-ui/react'

export const PartnersPrograms: React.FC = () => {
  const partnerPrograms: Record<string, any> = useMemo(() => ({
    institutions: {
      url: "https://docs.idle.finance/products/get-involved/institutions-program"
    },
    integrators: {
      url: "https://docs.idle.finance/products/get-involved/integrators-program"
    },
    security:{
      url: "https://docs.idle.finance/developers/security"
    }
    // products: {
    //   url: "https://docs.idle.finance/products/introduction"
    // },
    // developers: {
    //   url: "https://docs.idle.finance/developers/introduction"
    // }
  }), [])

  return (
    <SimpleGrid
      spacing={6}
      width={'full'}
      columns={[1, 3]}
    >
      {
        Object.keys(partnerPrograms).map( (program, index) => (
          <Card.Flex
            key={`program_${index}`}
            flexDirection={'column'}
            alignItems={'flex-start'}
          >
            <VStack
              flex={1}
              spacing={6}
              alignItems={'flex-start'}
            >
              <Image src={`images/partners/${program}.png`} width={16} height={16} />
              <Translation height={12} isHtml translation={`partnerPrograms.${program}.title`} component={Heading} as={'h3'} fontSize={'h3'} />
              <Translation translation={`partnerPrograms.${program}.body`} textStyle={'captionSmall'} />
              <HStack
                flex={1}
                spacing={1}
                alignItems={'flex-end'}
              >
                <Translation<LinkProps> href={partnerPrograms[program].url} component={Link} isExternal translation={`partnerPrograms.${program}.cta`} textStyle={['ctaStatic', 'clickable']} />
                <MdKeyboardArrowRight size={24} />
              </HStack>
            </VStack>
          </Card.Flex>
        ))
      }
    </SimpleGrid>
  )
}
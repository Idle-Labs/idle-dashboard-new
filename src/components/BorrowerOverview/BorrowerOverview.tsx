import { borrowers } from 'constants/'
import React, { useMemo } from 'react'
import { FaGlobe } from "react-icons/fa"
import { Card } from 'components/Card/Card'
import { SiCrunchbase } from "react-icons/si"
import { BsTwitterX, BsLinkedin } from "react-icons/bs"
import { useThemeProvider } from 'contexts/ThemeProvider'
import { Translation } from 'components/Translation/Translation'
import { VStack, Heading, Text, HStack, Link, Image, SimpleGrid } from '@chakra-ui/react'

type BorrowerOverviewArgs = {
  borrower: string
}

export const BorrowerOverview: React.FC<BorrowerOverviewArgs> = ({ borrower }) => {

  const borrowerInfo = useMemo(() => {
    return borrowers[borrower]
  }, [borrower])

  const { theme } = useThemeProvider()

  if (!borrowerInfo) return null

  return (
    <VStack
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'defi.borrowerOverview'} />
      <Card.Dark>
        <VStack
          spacing={6}
          width={'full'}
          alignItems={'flex-start'}
        >
          <HStack
            spacing={4}
            width={'full'}
            alignItems={'center'}
            justifyContent={'flex-start'}
          >
            <Image src={borrowerInfo.image} width={10} />
            <Heading as={'h4'} fontSize={'h4'}>{borrowerInfo.name}</Heading>
          </HStack>
          <VStack
            spacing={2}
            alignItems={'flex-start'}
          >
            <Translation component={Text} translation={'common.businessDescription'} textStyle={'titleSmall'} />
            <Text>{borrowerInfo.description}</Text>
          </VStack>
          <SimpleGrid
            columns={4}
            width={'full'}
          >
            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation component={Text} translation={'common.industry'} textStyle={'titleSmall'} />
              <Text>{borrowerInfo.industry}</Text>
            </VStack>
            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation component={Text} translation={'common.founded'} textStyle={'titleSmall'} />
              <Text>{borrowerInfo.founded}</Text>
            </VStack>
            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation component={Text} translation={'common.rating'} textStyle={'titleSmall'} />
              <Text>{borrowerInfo.rating}*</Text>
              {
                /*
                <Link display={'flex'} justifyContent={'center'} href={'https://credora.io/credit-evaluations/'} isExternal>
                  <HStack
                    px={2}
                    spacing={2}
                    borderRadius={8}
                    backgroundColor={'card.bg'}
                  >
                    <Text>{borrowerInfo.rating}</Text>
                    <Image src={'images/protocols/credora.svg'} height={3} />
                  </HStack>
                </Link>
                */
              }
            </VStack>
            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation component={Text} translation={'common.links'} textStyle={'titleSmall'} />
              <HStack
                spacing={3}
              >
              {
                Object.keys(borrowerInfo.links).map( linkType => {
                  return (
                    <Link
                      isExternal
                      display={'flex'}
                      key={`link_${linkType}`}
                      justifyContent={'center'}
                      href={borrowerInfo.links[linkType]}
                      sx={{'>:hover':{color:'primary !important'}}}
                    >
                      {
                        linkType === 'website' ? (
                          <FaGlobe size={22} color={theme.colors.primary} />
                        ) : linkType === 'twitter' ? (
                          <BsTwitterX size={22} color={theme.colors.primary} />
                        ) : linkType === 'linkedin' ? (
                          <BsLinkedin size={22} color={theme.colors.primary} />
                        ) : linkType === 'crunchbase' ? (
                          <SiCrunchbase size={22} color={theme.colors.primary} />
                        ): null
                      }
                    </Link>
                  )
                })
              }
              </HStack>
            </VStack>
          </SimpleGrid>
          <Link display={'flex'} justifyContent={'center'} href={'https://credora.io/credit-evaluations'} isExternal>
            <HStack
              spacing={1}
              alignItems={'center'}
              justifyContent={'flex-start'}
            >
              <Translation component={Text} prefix={'*'} translation={'defi.ratingProvidedBy'} textStyle={'captionSmall'} />
              <Image src={'images/protocols/credora.svg'} height={3} />
            </HStack>
          </Link>
        </VStack>
      </Card.Dark>
    </VStack>
  )
}
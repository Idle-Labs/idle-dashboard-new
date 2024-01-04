import { borrowers } from 'constants/'
import React, { useMemo } from 'react'
import { FaGlobe } from "react-icons/fa"
import { Card } from 'components/Card/Card'
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
          spacing={4}
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
              <Translation component={Text} translation={'common.headquarter'} textStyle={'titleSmall'} />
              <Text>{borrowerInfo.location}</Text>
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
              <Text>{borrowerInfo.rating}</Text>
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
                    <Link display={'flex'} justifyContent={'center'} href={borrowerInfo.links[linkType]} isExternal sx={{'>:hover':{color:'primary !important'}}}>
                      {
                        linkType === 'website' ? (
                          <FaGlobe size={22} color={theme.colors.primary} />
                        ) : linkType === 'twitter' ? (
                          <BsTwitterX size={22} color={theme.colors.primary} />
                        ) : linkType === 'linkedin' ? (
                          <BsLinkedin size={22} color={theme.colors.primary} />
                        ) : null
                      }
                    </Link>
                  )
                })
              }
              </HStack>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Card.Dark>
    </VStack>
  )
}
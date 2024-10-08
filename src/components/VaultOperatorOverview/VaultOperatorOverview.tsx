import React from 'react'
import { FaGlobe } from "react-icons/fa"
import { Card } from 'components/Card/Card'
import { SiCrunchbase } from "react-icons/si"
import { VaultOperator, operators } from 'constants/'
import { BsTwitterX, BsLinkedin } from "react-icons/bs"
import { useThemeProvider } from 'contexts/ThemeProvider'
import { Translation } from 'components/Translation/Translation'
import { VStack, Heading, Text, HStack, Link, Image, SimpleGrid } from '@chakra-ui/react'

type VaultOperatorOverviewArgs = {
  vaultOperators: VaultOperator[]
}

export const VaultOperatorOverview: React.FC<VaultOperatorOverviewArgs> = ({ vaultOperators }) => {
  const { theme } = useThemeProvider()
  return (
    <VStack
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      {
        vaultOperators.map( (operator: VaultOperator, index: number) => {
          const operatorInfo = operators[operator.name]
          if (!operatorInfo) return null
          return (
            <VStack
              spacing={6}
              width={'full'}
              key={`index_${index}`}
              alignItems={'flex-start'}
            >
              <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={`assets.assetDetails.operatorOverview.${operator.type}`} />
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
                    <Image src={operatorInfo.image} width={10} />
                    <Heading as={'h4'} fontSize={'h4'}>{operatorInfo.name}</Heading>
                  </HStack>
                  <VStack
                    spacing={2}
                    alignItems={'flex-start'}
                  >
                    <Translation component={Text} translation={'common.businessDescription'} textStyle={'titleSmall'} />
                    <Text>{operatorInfo.description}</Text>
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
                      <Text>{operatorInfo.industry}</Text>
                    </VStack>
                    <VStack
                      spacing={2}
                      alignItems={'flex-start'}
                    >
                      <Translation component={Text} translation={'common.founded'} textStyle={'titleSmall'} />
                      <Text>{operatorInfo.founded}</Text>
                    </VStack>
                    {
                      ['borrower', 'strategist'].includes(operator.type) && (
                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                        >
                          <Translation component={Text} translation={'common.rating'} textStyle={'titleSmall'} />
                          <Text>{operatorInfo.rating}*</Text>
                        </VStack>
                      )
                    }
                    <VStack
                      spacing={2}
                      alignItems={'flex-start'}
                    >
                      <Translation component={Text} translation={'common.links'} textStyle={'titleSmall'} />
                      <HStack
                        spacing={3}
                      >
                      {
                        Object.keys(operatorInfo.links).map( linkType => {
                          return (
                            <Link
                              isExternal
                              display={'flex'}
                              key={`link_${linkType}`}
                              justifyContent={'center'}
                              href={operatorInfo.links[linkType]}
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
                  {
                    ['borrower', 'strategist'].includes(operator.type) && (
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
                    )
                  }
                </VStack>
              </Card.Dark>
            </VStack>
          )
        })
      }
    </VStack>
  )
}
import './progress.css'
import { Card } from 'components/Card/Card'
import { StrategyCarouselItem, strategies } from 'constants/'
import { Translation } from 'components/Translation/Translation'
import { MdArrowBackIosNew, MdArrowForwardIos } from 'react-icons/md'
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useTheme, Button, Box, Progress, Flex, Stack, HStack, Image, VStack, Text } from '@chakra-ui/react'
import { usePausableChakraCarouselProvider, PausableChakraCarouselProvider } from 'components/PausableChakraCarousel/PausableChakraCarousel'

type StrategyDescriptionCarouselArgs = {
  delay: number
  color?: string
  strategy: string
}

const CarouselNav: React.FC = () => {
  const theme = useTheme()
  const { activeItem, itemsLength, pausableTimer: { stop }, goBack, goNext } = usePausableChakraCarouselProvider()
  if (itemsLength<=1) return null
  return (
    <Flex
      width={'100%'}
      alignItems={'center'}
      justifyContent={'flex-end'}
    >
      <HStack
        spacing={2}
      >
        <Button variant={'link'} minW={'auto'} onClick={() => { if (activeItem) stop(); goBack() }}>
          <MdArrowBackIosNew color={!activeItem ? theme.colors.ctaDisabled : theme.colors.primary} />
        </Button>
        <Text textStyle={'ctaStatic'}>{activeItem+1}/{itemsLength}</Text>
        <Button variant={'link'} minW={'auto'} onClick={() => { if (activeItem<itemsLength-1) stop(); goNext()}}>
          <MdArrowForwardIos color={activeItem === itemsLength-1 ? theme.colors.ctaDisabled : theme.colors.primary} />
        </Button>
      </HStack>
    </Flex>
  )
}

export const StrategyDescriptionCarousel: React.FC<StrategyDescriptionCarouselArgs> = ({ color, strategy, delay }) => {
  const strategyProps = strategies[strategy]

  const carouselItems = useMemo(() => {
    return strategyProps.carouselItems || []
  }, [strategyProps])

  if (!strategyProps.carouselItems) return null
  return (
    <PausableChakraCarouselProvider delay={delay}>
      <VStack
        width={'100%'}
        spacing={[3, 4]}
      >
        <Card.Dark
          p={0}
          bg={'black'}
          border={0}
          overflow={'hidden'}
          position={'relative'}
        >
          <PausableChakraCarouselProvider.Carousel progressColor={color}>
            {
              carouselItems.map( (carouselItem: StrategyCarouselItem, index: number) => {
                return (
                  <Stack
                    pr={[0, 4]}
                    width={'100%'}
                    spacing={4}
                    key={`carousel_${index}`}
                    direction={['column', 'row']}
                    justifyContent={['flex-start', 'space-between']}
                  >
                    <Image src={`${carouselItem.image}`} width={['100%','55%']} />
                    <VStack
                      pb={[4, 0]}
                      px={[6, 0]}
                      spacing={1}
                      width={['100%','50%']}
                      justifyContent={'center'}
                      alignItems={'flex-start'}
                    >
                      <Translation component={Text} translation={carouselItem.title} textStyle={'ctaStatic'} />
                      <Translation component={Text} translation={carouselItem.description} textStyle={'caption'} />
                    </VStack>
                  </Stack>
                )
              })
            }
          </PausableChakraCarouselProvider.Carousel>
        </Card.Dark>
        <CarouselNav />
      </VStack>
    </PausableChakraCarouselProvider>
  )
}
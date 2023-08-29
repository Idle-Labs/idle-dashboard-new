import './progress.css'
import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { StrategyCarouselItem, strategies } from 'constants/'
import { Pagination } from 'components/Pagination/Pagination'
import { Translation } from 'components/Translation/Translation'
import { useTheme, Stack, Image, VStack } from '@chakra-ui/react'
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
    <Pagination
      activePage={activeItem+1}
      pages={itemsLength}
      onPrevArrowClick={() => { if (activeItem) stop(); goBack() }}
      onNextArrowClick={() => { if (activeItem<itemsLength-1) stop(); goNext()}}
      prevArrowColor={!activeItem ? theme.colors.ctaDisabled : theme.colors.primary}
      nextArrowColor={activeItem === itemsLength-1 ? theme.colors.ctaDisabled : theme.colors.primary}
    />
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
          border={0}
          bg={'black'}
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
                    <Image src={`${carouselItem.image}`} width={['100%','55%']} sx={{objectFit: 'contain'}} />
                    <VStack
                      pb={[4, 0]}
                      px={[6, 0]}
                      spacing={1}
                      width={['100%','50%']}
                      justifyContent={'center'}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={carouselItem.title} textStyle={'ctaStatic'} />
                      <Translation translation={carouselItem.description} textStyle={'caption'} />
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
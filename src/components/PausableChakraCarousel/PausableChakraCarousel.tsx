import { useThemeProvider } from 'contexts/ThemeProvider'
import type { ProviderProps } from 'contexts/common/types'
import { CgArrowLeft, CgArrowRight } from 'react-icons/cg'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import { usePausableTimer, PausableTimerReturns } from 'hooks/usePausableTimer/usePausableTimer'
import React, { useCallback, useState, useEffect, useMemo, createContext, useContext } from 'react'
import { useTheme, StackProps, ContainerProps, Box, Flex, HStack, IconButton } from '@chakra-ui/react'

type PausableChakraCarouselContextProps = {
  delay: number
  goNext: Function
  goBack: Function
  goToItem: Function
  activeItem: number
  itemsLength: number
  setItemsLength: Function
  pausableTimer: PausableTimerReturns
}

const initialState = {
  delay: 0,
  activeItem: 0,
  itemsLength: 0,
  goNext: () => {},
  goBack: () => {},
  goToItem: () => {},
  setItemsLength: () => {},
  pausableTimer: {
    status: 'stopped',
    start: () => {},
    pause: () => {},
    resume: () => {},
    stop: () => {},
  }
}

const PausableChakraCarouselContext = createContext<PausableChakraCarouselContextProps>(initialState)
export const usePausableChakraCarouselProvider = () => useContext(PausableChakraCarouselContext)

type PausableChakraCarouselArgs = {
  showProgress?: boolean
  enableDragging?: boolean
  progressColor?: string
} & ContainerProps

const PausableChakraCarousel: React.FC<PausableChakraCarouselArgs> = ({ children, showProgress = true, enableDragging = false, progressColor = '#cccccc' }) => {

  const {
    delay,
    activeItem,
    itemsLength,
    pausableTimer,
    setItemsLength
  } = usePausableChakraCarouselProvider()
  
  const carouselItems = React.Children.count(children)

  useEffect(() => {
    if (!carouselItems) return
    setItemsLength(carouselItems)
  }, [carouselItems, setItemsLength])

  const { status: timeoutStatus, start, pause, resume, stop } = pausableTimer

  // const pauseCaoursel = useCallback(() => {
  //   pause()
  // }, [pause])

  // console.log('RENDER', timeoutStatus, pausableTimer)

  useEffect(() => {
    if (itemsLength<=1) return
    start()
    return () => {
      stop()
    }
  }, [start, stop, itemsLength])

  const progressBar = useMemo(() => {
    if (!showProgress || timeoutStatus === 'stopped') return null
    return (
      <Box
        left={0}
        bottom={0}
        height={'3px'}
        bg={progressColor}
        position={'absolute'}
        sx={{
          animationName: 'progress',
          animationIterationCount: 1,
          animationFillMode: 'forwards',
          animationPlayState: timeoutStatus,
          animationTimingFunction: 'ease-in-out',
          animationDuration: `${Math.round(delay/1000)}s`,
        }}
      />
    )
  }, [delay, progressColor, timeoutStatus, showProgress])

  return (
    <Box
      width={'full'}
      position={'relative'}
    >
      <Box
        width={'full'}
        onMouseOut={() => resume() }
        onMouseOver={() => pause()}
      >
        {
          /*
          <Box
            layerStyle={'overlay'}
            onMouseOut={() => resume() }
            onMouseOver={() => pause()}
          />
          */
        }
        <ChakraCarousel
          gap={0}
          enableDragging={enableDragging}
          activeItem={activeItem}
        >
          {children}
        </ChakraCarousel>
      </Box>
      {progressBar}
    </Box>
  )
}

type PausableChakraCarouselProviderArgs = {
  delay: number
} & ProviderProps

export const DotNav: React.FC = () => {
  const { activeItem, itemsLength, pausableTimer: { stop }, goToItem } = usePausableChakraCarouselProvider()
  return (
    <Flex
      width={'100%'}
      alignItems={'center'}
      justifyContent={'flex-end'}
    >
      <HStack
        spacing={2}
      >
        {
          Array.from(Array(itemsLength).keys()).map( itemIndex => (
            <Box key={`${Math.random()}`} w={2} h={2} borderRadius={'50%'} cursor={'pointer'} bg={ activeItem === itemIndex ? 'primary' : 'ctaDisabled' } onClick={() => { if (activeItem) stop(); goToItem(itemIndex) }} />
          ))
        }
      </HStack>
    </Flex>
  )
}

type ArrowNavArgs = {
  flexProps?: StackProps
}

export const ArrowNav: React.FC<ArrowNavArgs> = ({
  flexProps
}) => {
  const theme = useTheme()
  const { activeItem, itemsLength, pausableTimer: { stop }, goBack, goNext } = usePausableChakraCarouselProvider()
  return (
    <HStack
      spacing={3}
      width={'100%'}
      alignItems={'center'}
      justifyContent={['center','flex-end']}
      {...flexProps}
    >
      <IconButton
        size={'md'}
        borderRadius={'50%'}
        aria-label={'prev'}
        colorScheme={'whiteAlpha'}
        onClick={() => {stop(); goBack()}}
        disabled={!activeItem}
        icon={
          <CgArrowLeft
            size={20}
            color={theme.colors.card.bg}
          />
        }
      />

      <IconButton
        size={'md'}
        borderRadius={'50%'}
        aria-label={'next'}
        colorScheme={'whiteAlpha'}
        onClick={() => {stop(); goNext()}}
        disabled={activeItem === itemsLength-1}
        icon={
          <CgArrowRight
            size={20}
            color={theme.colors.card.bg}
          />
        }
      />
    </HStack>
  )
}

export function PausableChakraCarouselProvider({ children, delay }: PausableChakraCarouselProviderArgs) {
  const { isMobile } = useThemeProvider()
  const [ activeItem, setActiveItem ] = useState<number>(0)
  const [ itemsLength, setItemsLength ] = useState<number>(0)

  const goToItem = useCallback((itemIndex: number) => {
    if (itemIndex>=0 && itemIndex<=itemsLength-1){
      return setActiveItem(itemIndex)
    }
    return true
  }, [setActiveItem, itemsLength])

  const goBack = useCallback(() => {
    if (!activeItem) return false
    setActiveItem( (prevActiveItem: number) => {
      return Math.max(0, prevActiveItem-1)
    })
    return true
  }, [setActiveItem, activeItem])

  const goNext = useCallback(() => {
    if (activeItem===itemsLength-1) return false
    setActiveItem( (prevActiveItem: number) => {
      return Math.min(itemsLength-1, prevActiveItem+1)
    })
  }, [setActiveItem, activeItem, itemsLength])

  const startCarousel = useCallback(() => {
    if (activeItem === itemsLength -1) {
      goToItem(0)
    } else {
      goNext()
    }
  }, [activeItem, goToItem, goNext, itemsLength])

  const pausableTimer = usePausableTimer(startCarousel, delay)

  useEffect(() => {
    goToItem(0)
  }, [goToItem, isMobile])

  return (
    <PausableChakraCarouselContext.Provider value={{ delay, goBack, goToItem, goNext, activeItem, itemsLength, pausableTimer, setItemsLength }}>
      {children}
    </PausableChakraCarouselContext.Provider>
  )
}

PausableChakraCarouselProvider.DotNav = DotNav
PausableChakraCarouselProvider.ArrowNav = ArrowNav
PausableChakraCarouselProvider.Carousel = PausableChakraCarousel
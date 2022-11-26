import { ContainerProps, Box } from '@chakra-ui/react'
import type { ProviderProps } from 'contexts/common/types'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import { usePausableTimer, PausableTimerReturns } from 'hooks/usePausableTimer/usePausableTimer'
import React, { useCallback, useState, useEffect, useMemo, createContext, useContext } from 'react'

type PausableChakraCarouselContextProps = {
  delay: number
  activeItem: number
  itemsLength: number
  goNext: Function
  goBack: Function
  goToItem: Function
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
  progressColor?: string
} & ContainerProps

const PausableChakraCarousel: React.FC<PausableChakraCarouselArgs> = ({ children, progressColor = '#cccccc' }) => {

  const {
    delay,
    activeItem,
    itemsLength,
    pausableTimer,
    setItemsLength,
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
    if (!itemsLength) return
    start()
    return () => {
      stop()
    }
  }, [start, stop, itemsLength])

  const progressBar = useMemo(() => {
    if (timeoutStatus === 'stopped') return null
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
  }, [delay, progressColor, timeoutStatus])

  return (
    <>
      <Box>
        <Box
          layerStyle={'overlay'}
          onMouseOut={() => resume() }
          onMouseOver={() => pause()}
        />
        <ChakraCarousel
          gap={0}
          enableDragging={false}
          activeItem={activeItem}
        >
          {children}
        </ChakraCarousel>
      </Box>
      {progressBar}
    </>
  )
}

type PausableChakraCarouselProviderArgs = {
  delay: number
} & ProviderProps

export function PausableChakraCarouselProvider({ children, delay }: PausableChakraCarouselProviderArgs) {
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
      return Math.max(0, activeItem-1)
    })
    return true
  }, [setActiveItem, activeItem])

  const goNext = useCallback(() => {
    if (activeItem===itemsLength-1) return false
    setActiveItem( (prevActiveItem: number) => {
      return Math.min(itemsLength-1, activeItem+1)
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

  return (
    <PausableChakraCarouselContext.Provider value={{ delay, goBack, goToItem, goNext, activeItem, itemsLength, pausableTimer, setItemsLength }}>
      {children}
    </PausableChakraCarouselContext.Provider>
  )
}

PausableChakraCarouselProvider.Carousel = PausableChakraCarousel
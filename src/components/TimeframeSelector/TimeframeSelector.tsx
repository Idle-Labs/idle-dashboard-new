import React from 'react'
import { HistoryTimeframe } from 'constants/types'
import { HStack, Text, Button, StackProps } from '@chakra-ui/react'

type TimeframeSelectorArgs = {
  timeframe: HistoryTimeframe
  setTimeframe: Function
  variant?: 'button' | 'text'
} & StackProps

export const TimeframeSelector: React.FC<TimeframeSelectorArgs> = ({ timeframe: selectedTimeframe, setTimeframe, variant = 'text', ...props }) => {
  return (
    <HStack
      spacing={variant === 'button' ? 4 : [6, 10]}
      {...props}
    >
      {
        Object.values(HistoryTimeframe).map( timeframe => {
          const selected = timeframe === selectedTimeframe
          switch (variant){
            default:
            case 'text':
              return (
                <Text
                  textStyle={'cta'}
                  color={'ctaDisabled'}
                  aria-selected={selected}
                  key={`timeframe_${timeframe}`}
                  onClick={() => setTimeframe(timeframe)}
                >
                  {timeframe.toUpperCase()}
                </Text>
              )
            case 'button':
              return (
                <Button
                  px={3}
                  border={0}
                  textStyle={'cta'}
                  variant={'filter'}
                  aria-selected={selected}
                  key={`timeframe_${timeframe}`}
                  onClick={() => setTimeframe(timeframe)}
                >
                  {timeframe.toUpperCase()}
                </Button>
              )
          }
        })
      }
    </HStack>
  )
}
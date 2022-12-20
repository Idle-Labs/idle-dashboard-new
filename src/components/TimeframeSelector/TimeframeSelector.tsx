import React from 'react'
import { HistoryTimeframe } from 'constants/types'
import { HStack, Text, StackProps } from '@chakra-ui/react'

type TimeframeSelectorArgs = {
  timeframe: HistoryTimeframe
  setTimeframe: Function
} & StackProps

export const TimeframeSelector: React.FC<TimeframeSelectorArgs> = ({ timeframe: selectedTimeframe, setTimeframe, ...props }) => {
  return (
    <HStack
      spacing={[6, 10]}
      {...props}
    >
      {
        Object.values(HistoryTimeframe).map( timeframe => {
          const selected = timeframe === selectedTimeframe
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
        })
      }
    </HStack>
  )
}
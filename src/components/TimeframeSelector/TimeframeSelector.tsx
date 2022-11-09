import React from 'react'
import { HStack, Text } from '@chakra-ui/react'
import { HistoryTimeframe } from 'constants/types'

type TimeframeSelectorArgs = {
  timeframe: HistoryTimeframe
  setTimeframe: Function
}

export const TimeframeSelector: React.FC<TimeframeSelectorArgs> = ({ timeframe: selectedTimeframe, setTimeframe }) => {
  return (
    <HStack
      spacing={[6, 10]}
    >
      {
        Object.values(HistoryTimeframe).map( timeframe => {
          const selected = timeframe === selectedTimeframe
          return (
            <Text
              aria-selected={selected}
              textStyle={['cta', 'dark']}
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
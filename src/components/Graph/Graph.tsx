import { useMemo } from 'react'
import { isEmpty } from 'lodash'
import { ParentSize } from '@visx/responsive'
import { Center, Fade, SlideFade } from '@chakra-ui/react'
import { BalanceChartData } from 'hooks/useBalanceChartData'

import { GraphLoading } from './GraphLoading'
import { PrimaryChart } from './PrimaryChart'

type GraphProps = {
  data: BalanceChartData
  isLoaded?: boolean
  loading?: boolean
  color: string
  isRainbowChart?: boolean
}

export const Graph: React.FC<GraphProps> = ({ data, isLoaded, loading, color, isRainbowChart }) => {
  return useMemo(() => {
    const { total, rainbow } = data
    return (
      <ParentSize debounceTime={10}>
        {parent => {
          const primaryChartProps = {
            height: parent.height,
            width: parent.width,
            color,
            margin: {
              top: 16,
              right: 0,
              bottom: 60,
              left: 0,
            },
          }
          return loading || !isLoaded ? (
            <Fade in={loading || !isLoaded}>
              <Center width='full' height={parent.height} overflow='hidden'>
                <GraphLoading />
              </Center>
            </Fade>
          ) : !isEmpty(data) ? (
            <SlideFade in={!loading}>
              <PrimaryChart {...primaryChartProps} data={total} />
            </SlideFade>
          ) : null
        }}
      </ParentSize>
    )
  }, [color, data, isLoaded, loading])
}

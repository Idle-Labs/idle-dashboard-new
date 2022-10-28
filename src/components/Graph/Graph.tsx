import { useMemo } from 'react'
import { isEmpty } from 'lodash'
import { abbreviateNumber } from 'helpers/'
import { ParentSize } from '@visx/responsive'
import { Center, Fade, SlideFade } from '@chakra-ui/react'
import { BalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'

import { GraphLoading } from './GraphLoading'
import { PrimaryChart } from './PrimaryChart'
import { RainbowChart } from './RainbowChart'

type GraphProps = {
  data: BalanceChartData
  isLoaded?: boolean
  loading?: boolean
  color: string
  formatFn?: Function
  axisEnabled?: boolean
  isRainbowChart?: boolean
}

export const Graph: React.FC<GraphProps> = ({
    data,
    isLoaded,
    loading,
    color,
    formatFn,
    isRainbowChart,
    axisEnabled = true
  }) => {
  return useMemo(() => {
    const { total, rainbow } = data

    const formatValue = formatFn || ((n: any) => abbreviateNumber(n))
    return (
      <ParentSize debounceTime={10}>
        {parent => {
          const primaryChartProps = {
            height: parent.height,
            width: parent.width,
            color,
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
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
              {isRainbowChart && rainbow.length ? (
                <RainbowChart {...primaryChartProps} data={rainbow} formatFn={formatValue} axisEnabled={axisEnabled} />
              ) : total.length && (
                <PrimaryChart {...primaryChartProps} data={total} formatFn={formatValue} axisEnabled={axisEnabled} />
              )}
            </SlideFade>
          ) : null
        }}
      </ParentSize>
    )
  }, [color, data, isLoaded, loading, isRainbowChart, formatFn, axisEnabled])
}

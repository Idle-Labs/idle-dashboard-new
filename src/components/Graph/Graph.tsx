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
  maxMinEnabled?: boolean
  isRainbowChart?: boolean
  margins?: { top: number; right: number; bottom: number; left: number }
}

export const Graph: React.FC<GraphProps> = ({
    data,
    isLoaded,
    loading,
    color,
    formatFn,
    isRainbowChart,
    axisEnabled = true,
    maxMinEnabled = true,
    margins = { top: 0, right: 0, bottom: 0, left: 0 }
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
            margins
          }
          return loading || !isLoaded ? (
            <Fade in={loading || !isLoaded}>
              <Center width='full' height={parent.height} overflow='hidden'>
                <GraphLoading />
              </Center>
            </Fade>
          ) : !isEmpty(data) ? (
            <SlideFade in={!loading}>
              {isRainbowChart && rainbow.length>0 ? (
                <RainbowChart {...primaryChartProps} data={rainbow} formatFn={formatValue} axisEnabled={axisEnabled} maxMinEnabled={maxMinEnabled} />
              ) : total.length>0 && (
                <PrimaryChart {...primaryChartProps} data={total} formatFn={formatValue} axisEnabled={axisEnabled} maxMinEnabled={maxMinEnabled} />
              )}
            </SlideFade>
          ) : null
        }}
      </ParentSize>
    )
  }, [color, data, isLoaded, loading, isRainbowChart, formatFn, axisEnabled, maxMinEnabled, margins])
}

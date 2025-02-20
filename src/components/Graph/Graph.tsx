import { useMemo } from 'react'
import { isEmpty } from 'lodash'
import { abbreviateNumber } from 'helpers/'
import { ParentSize } from '@visx/responsive'
import type { AssetId } from 'constants/types'
import { ContinuousScaleType } from "@visx/scale"
import { Center, Fade, SlideFade } from '@chakra-ui/react'
import { BalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'

import { GraphLoading } from './GraphLoading'
import { PrimaryChart } from './PrimaryChart'
import { RainbowChart } from './RainbowChart'

export type GraphProps = {
  color: string
  loading?: boolean
  isLoaded?: boolean
  assetIds?: AssetId[]
  formatFn?: Function
  axisEnabled?: boolean
  data: BalanceChartData
  maxMinEnabled?: boolean
  isRainbowChart?: boolean
  gradientEnabled?: boolean
  scaleType?: ContinuousScaleType
  margins?: { top: number; right: number; bottom: number; left: number }
}

export const Graph: React.FC<GraphProps> = ({
    data,
    color,
    loading,
    assetIds,
    formatFn,
    isLoaded,
    scaleType,
    isRainbowChart,
    axisEnabled = true,
    maxMinEnabled = true,
    gradientEnabled = true,
    margins = { top: 0, right: 0, bottom: 0, left: 0 }
  }) => {
  return useMemo(() => {
    const { total, rainbow } = data

    // console.log('assetIds', assetIds)

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
              {isRainbowChart && rainbow.length>0 && assetIds && assetIds.length>1 ? (
                <RainbowChart {...primaryChartProps} data={rainbow} formatFn={formatValue} axisEnabled={axisEnabled} maxMinEnabled={maxMinEnabled} gradientEnabled={gradientEnabled} scaleType={scaleType} />
              ) : total.length>0 && (
                <PrimaryChart {...primaryChartProps} data={total} formatFn={formatValue} axisEnabled={axisEnabled} maxMinEnabled={maxMinEnabled} gradientEnabled={gradientEnabled} />
              )}
            </SlideFade>
          ) : null
        }}
      </ParentSize>
    )
  }, [color, data, assetIds, isLoaded, scaleType, loading, isRainbowChart, formatFn, axisEnabled, maxMinEnabled, gradientEnabled, margins])
}

import { useEffect, useMemo } from 'react'
import { Graph } from 'components/Graph/Graph'
import { Box, BoxProps } from '@chakra-ui/react'
import type { AssetId, HistoryTimeframe } from 'constants/types'
import { calculatePercentChange, numberToPercentage } from 'helpers/'
import { useRateChartData } from 'hooks/useRateChartData/useRateChartData'

type RateChartArgs = {
  assetIds: AssetId[]
  percentChange: number
  timeframe: HistoryTimeframe
  axisEnabled?: boolean
  setPercentChange: (percentChange: number) => void
} & BoxProps

export const RateChart: React.FC<RateChartArgs> = ({
  assetIds,
  timeframe,
  percentChange,
  setPercentChange,
  axisEnabled = true,
  ...props
}) => {
  const { assets, rateChartData, rateChartDataLoading } = useRateChartData({
    assetIds,
    timeframe,
  })

  const { total } = rateChartData

  useEffect(() => setPercentChange(calculatePercentChange(total)), [total, setPercentChange])


  const formatFn = (n: any) => numberToPercentage(n)
  
  const isRainbowChart = assetIds.length > 1

  const color = useMemo(() => {
    const defaultColor = 'chart.stroke'
    if (assets?.length === 1){
      return assets[0]?.color || defaultColor
    }
    return defaultColor
  }, [assets])

  return (
    <Box p={0} width={'100%'} {...props}>
      <Graph
        color={color}
        formatFn={formatFn}
        data={rateChartData}
        maxMinEnabled={false}
        axisEnabled={axisEnabled}
        loading={rateChartDataLoading}
        isRainbowChart={isRainbowChart}
        isLoaded={!rateChartDataLoading}
      />
    </Box>
  )
}

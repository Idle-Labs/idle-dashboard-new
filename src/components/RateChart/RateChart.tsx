import { useEffect } from 'react'
import { Box, BoxProps } from '@chakra-ui/react'
import { Graph } from 'components/Graph/Graph'
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
  const { rateChartData, rateChartDataLoading } = useRateChartData({
    assetIds,
    timeframe,
  })

  const { total } = rateChartData

  useEffect(() => setPercentChange(calculatePercentChange(total)), [total, setPercentChange])

  const color = 'chart.stroke'

  const formatFn = (n: any) => numberToPercentage(n)

  // console.log('rateChartData', assetIds, rateChartDataLoading, rateChartData)

  return (
    <Box id={JSON.stringify(assetIds)} p={0} width={'100%'} {...props}>
      <Graph
        color={color}
        formatFn={formatFn}
        data={rateChartData}
        isRainbowChart={true}
        axisEnabled={axisEnabled}
        loading={rateChartDataLoading}
        isLoaded={!rateChartDataLoading}
      />
    </Box>
  )
}

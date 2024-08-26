import { HistoryTimeframe, DateRange, AssetId } from 'constants/types'
import { HistogramChart } from 'components/HistogramChart/HistogramChart'
import { useEarningsChartData } from 'hooks/useEarningsChartData/useEarningsChartData'

type EarningsChartArgs = {
  assetIds: AssetId[]
  dateRange?: DateRange
  timeframe?: HistoryTimeframe,
  margin?: { top: number; right: number; bottom: number; left: number }
}

export const EarningsChart: React.FC<EarningsChartArgs> = ({ assetIds, timeframe, dateRange, margin }) => {
  const {
    labels,
    colors,
    earningsChartData,
    earningsChartDataLoading
  } = useEarningsChartData({assetIds, timeframe, dateRange})

  return !earningsChartDataLoading ? (
    <HistogramChart
      colors={colors}
      labels={labels}
      usePlainLabels={true}
      axisEnabled={false}
      data={earningsChartData.rainbow}
      margin={margin}
    />
  ) : null
}
import { HistoryTimeframe, DateRange, AssetId } from 'constants/types'
import { HistogramChart } from 'components/HistogramChart/HistogramChart'
import { useEarningsChartData } from 'hooks/useEarningsChartData/useEarningsChartData'

type EarningsChartArgs = {
  assetIds: AssetId[]
  dateRange?: DateRange
  timeframe?: HistoryTimeframe
}

export const EarningsChart: React.FC<EarningsChartArgs> = ({ assetIds, timeframe, dateRange }) => {
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
      data={earningsChartData.rainbow}
    />
  ) : null
}
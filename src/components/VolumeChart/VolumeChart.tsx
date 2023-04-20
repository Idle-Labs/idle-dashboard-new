import { HistoryTimeframe, DateRange, AssetId } from 'constants/types'
import { HistogramChart } from 'components/HistogramChart/HistogramChart'
import { useVolumeChartData } from 'hooks/useVolumeChartData/useVolumeChartData'

type VolumeChartArgs = {
  assetIds: AssetId[]
  dateRange?: DateRange
  timeframe?: HistoryTimeframe
}

export const VolumeChart: React.FC<VolumeChartArgs> = ({ assetIds, timeframe, dateRange }) => {
  const {
    labels,
    colors,
    volumeChartData,
    volumeChartDataLoading
  } = useVolumeChartData({assetIds, timeframe, dateRange})

  // console.log('VolumeChart', assetIds, volumeChartData, labels, colors)

  return !volumeChartDataLoading ? (
    <HistogramChart
      colors={colors}
      labels={labels}
      data={volumeChartData.rainbow}
    />
  ) : null
}
import { HistoryTimeframe, AssetId } from 'constants/types'
import { HistogramChart } from 'components/HistogramChart/HistogramChart'
import { useVolumeChartData } from 'hooks/useVolumeChartData/useVolumeChartData'

type VolumeChartArgs = {
  assetIds: AssetId[]
  timeframe?: HistoryTimeframe
}

export const VolumeChart: React.FC<VolumeChartArgs> = ({ assetIds, timeframe }) => {
  const {
    labels,
    colors,
    volumeChartData,
    volumeChartDataLoading
  } = useVolumeChartData({assetIds, timeframe})

  // console.log('VolumeChart', assetIds, volumeChartData, labels, colors)

  return !volumeChartDataLoading ? (
    <HistogramChart
      colors={colors}
      labels={labels}
      data={volumeChartData.rainbow}
    />
  ) : null
}
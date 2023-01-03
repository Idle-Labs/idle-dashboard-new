import type { AssetId } from 'constants/types'
import { BarChart } from 'components/BarChart/BarChart'
import { useAllocationChartData } from 'hooks/useAllocationChartData/useAllocationChartData'

type AllocationChartArgs = {
  assetId: AssetId | undefined
}

export const AllocationChart: React.FC<AllocationChartArgs> = ({ assetId }) => {
  const {
    allocations,
    colors,
    labels
  } = useAllocationChartData({assetId})

  return allocations ? (
    <BarChart
      colors={colors}
      labels={labels}
      data={allocations}
    />
  ) : null
}
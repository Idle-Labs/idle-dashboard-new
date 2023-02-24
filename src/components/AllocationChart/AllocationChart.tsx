import type { AssetId } from 'constants/types'
import { BarChart } from 'components/BarChart/BarChart'
import { useAllocationChartData } from 'hooks/useAllocationChartData/useAllocationChartData'

type AllocationChartArgs = {
  assetIds: AssetId[]
}

export const AllocationChart: React.FC<AllocationChartArgs> = ({ assetIds }) => {
  const {
    allocations,
    colors,
    labels
   } = useAllocationChartData({ assetIds })

  return allocations ? (
    <BarChart
      colors={colors}
      labels={labels}
      data={allocations}
    />
  ) : null
}
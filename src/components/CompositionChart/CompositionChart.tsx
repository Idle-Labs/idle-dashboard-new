import { Box } from '@chakra-ui/react'
import type { AssetId } from 'constants/types'
import { DonutChart } from 'components/DonutChart/DonutChart'
// import { useAllocationChartData } from 'hooks/useAllocationChartData/useAllocationChartData'

type CompositionChartArgs = {
  strategies?: string[]
}

export const CompositionChart: React.FC<CompositionChartArgs> = ({ strategies }) => {

  // const {
  //   allocations,
  //   colors,
  //   labels
  // } = useAllocationChartData({assetId})

  const colors= {
    'Junior Tranche': '#FFD15C',
    'Senior Tranche': '#4DE3B0',
    'Best Yield': '#6AE4FF',
  }

  const data= [
    {
      label: 'Junior Tranche',
      value: 100
    },
    {
      label: 'Senior Tranche',
      value: 231
    },
    {
      label: 'Best Yield',
      value: 123
    },
  ]

  return data ? (
    <Box height={350}>
      <DonutChart
        data={data}
        colors={colors}
      />
    </Box>
  ) : null
}
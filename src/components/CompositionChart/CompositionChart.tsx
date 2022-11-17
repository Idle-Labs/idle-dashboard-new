import { Box } from '@chakra-ui/react'
import type { AssetId } from 'constants/types'
import { DonutChart } from 'components/DonutChart/DonutChart'
import { useCompositionChartData } from 'hooks/useCompositionChartData/useCompositionChartData'

type CompositionChartArgs = {
  assetIds: AssetId[],
  strategies?: string[]
}

export const CompositionChart: React.FC<CompositionChartArgs> = ({ assetIds, strategies }) => {

  const {
    composition,
    colors,
  } = useCompositionChartData({ assetIds, strategies })

  return composition ? (
    <Box
      height={350}
      width={'100%'}
    >
      <DonutChart
        colors={colors}
        data={composition}
      />
    </Box>
  ) : null
}
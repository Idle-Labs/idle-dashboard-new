import { useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import { Graph } from 'components/Graph/Graph'
import { calculatePercentChange } from 'helpers/charts'
import type { AssetId, HistoryTimeframe } from 'constants/types'
import { useBalanceChartData } from 'hooks/useBalanceChartData'

type BalanceChartArgs = {
  assetIds: AssetId[]
  accountId?: string
  timeframe: HistoryTimeframe
  percentChange: number
  setPercentChange: (percentChange: number) => void
  isRainbowChart: boolean
}

export const BalanceChart: React.FC<BalanceChartArgs> = ({
  assetIds,
  accountId,
  timeframe,
  percentChange,
  setPercentChange,
  isRainbowChart,
}) => {
  const { balanceChartData, balanceChartDataLoading } = useBalanceChartData({
    assetIds,
    accountId,
    timeframe,
  })

  const { total } = balanceChartData

  useEffect(() => setPercentChange(calculatePercentChange(total)), [total, setPercentChange])

  const color = 'chart.stroke'

  return (
    <Box p={0} height='350px'>
      <Graph
        color={color}
        data={balanceChartData}
        loading={balanceChartDataLoading}
        isLoaded={!balanceChartDataLoading}
        isRainbowChart={isRainbowChart}
      />
    </Box>
  )
}

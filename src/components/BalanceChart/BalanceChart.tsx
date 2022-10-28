import { useEffect } from 'react'
import { Box } from '@chakra-ui/react'
import { Graph } from 'components/Graph/Graph'
import type { AssetId, HistoryTimeframe } from 'constants/types'
import { abbreviateNumber, calculatePercentChange } from 'helpers/'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'

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

  const formatFn = (n: any) => abbreviateNumber(n)

  return (
    <Box p={0} height='350px'>
      <Graph
        color={color}
        formatFn={formatFn}
        data={balanceChartData}
        isRainbowChart={isRainbowChart}
        loading={balanceChartDataLoading}
        isLoaded={!balanceChartDataLoading}
      />
    </Box>
  )
}

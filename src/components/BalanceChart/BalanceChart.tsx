import { Box } from '@chakra-ui/react'
import { useEffect, useMemo } from 'react'
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
  margins?: { top: number; right: number; bottom: number; left: number }
}

export const BalanceChart: React.FC<BalanceChartArgs> = ({
  assetIds,
  accountId,
  timeframe,
  percentChange,
  isRainbowChart,
  setPercentChange,
  margins = { top: 0, right: 0, bottom: 0, left: 0 }
}) => {
  const { assets, balanceChartData, balanceChartDataLoading } = useBalanceChartData({
    assetIds,
    accountId,
    timeframe,
  })

  const { total } = balanceChartData

  useEffect(() => setPercentChange(calculatePercentChange(total)), [total, setPercentChange])

  const color = useMemo(() => {
    const defaultColor = 'chart.stroke'
    if (assets?.length === 1){
      return assets[0]?.color || defaultColor
    }
    return defaultColor
  }, [assets])

  const formatFn = (n: any) => abbreviateNumber(n)

  return (
    <Box p={0} height={'350px'}>
      <Graph
        color={color}
        margins={margins}
        formatFn={formatFn}
        data={balanceChartData}
        isRainbowChart={isRainbowChart}
        loading={balanceChartDataLoading}
        isLoaded={!balanceChartDataLoading}
      />
    </Box>
  )
}

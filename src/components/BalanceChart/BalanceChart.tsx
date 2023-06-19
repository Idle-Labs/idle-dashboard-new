import { Box } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Graph } from 'components/Graph/Graph'
import type { AssetId, HistoryTimeframe } from 'constants/types'
import { abbreviateNumber, calculatePercentChange } from 'helpers/'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'

type BalanceChartArgs = {
  color?: string
  accountId?: string
  assetIds: AssetId[]
  strategies?: string[]
  percentChange: number
  isRainbowChart: boolean
  loadingEnabled?: boolean
  allowFlatChart?: boolean
  timeframe: HistoryTimeframe
  setPercentChange: (percentChange: number) => void
  margins?: { top: number; right: number; bottom: number; left: number }
}

export const BalanceChart: React.FC<BalanceChartArgs> = ({
  assetIds,
  accountId,
  timeframe,
  strategies,
  // percentChange,
  isRainbowChart,
  setPercentChange,
  allowFlatChart = true,
  color = 'chart.stroke',
  loadingEnabled = true,
  margins = { top: 0, right: 0, bottom: 0, left: 0 }
}) => {
  const { balanceChartData, balanceChartDataLoading } = useBalanceChartData({
    assetIds,
    accountId,
    timeframe,
    strategies,
    allowFlatChart
  })

  const { total } = balanceChartData

  // console.log('balanceChartDataLoading', balanceChartDataLoading)
  // console.log('balanceChartData', assetIds, strategies, balanceChartData)

  useEffect(() => setPercentChange(calculatePercentChange(total)), [total, setPercentChange])

  // const color = useMemo(() => {
  //   const defaultColor = 'chart.stroke'
  //   if (assets?.length === 1){
  //     return assets[0]?.color || defaultColor
  //   }
  //   return defaultColor
  // }, [assets])

  const formatFn = (n: any) => `$${abbreviateNumber(n)}`

  return (
    <Box width={'full'} p={0} height={'350px'}>
      <Graph
        color={color}
        margins={margins}
        formatFn={formatFn}
        data={balanceChartData}
        isRainbowChart={isRainbowChart}
        isLoaded={!balanceChartDataLoading}
        loading={balanceChartDataLoading && loadingEnabled}
      />
    </Box>
  )
}

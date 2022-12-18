import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'
import { abbreviateNumber } from 'helpers/'
import { Graph } from 'components/Graph/Graph'
import type { AssetId, HistoryTimeframe } from 'constants/types'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'

type GenericChartArgs = {
  color?: string
  height?: string
  accountId?: string
  assetIds: AssetId[]
  formatFn?: Function
  percentChange: number
  isRainbowChart: boolean
  data?: BalanceChartData
  timeframe: HistoryTimeframe
  setPercentChange: (percentChange: number) => void
  margins?: { top: number; right: number; bottom: number; left: number }
}

export const GenericChart: React.FC<GenericChartArgs> = ({
  data,
  assetIds,
  accountId,
  timeframe,
  percentChange,
  isRainbowChart,
  height = '350px',
  setPercentChange,
  color = 'chart.stroke',
  formatFn = (n: any) => `$${abbreviateNumber(n)}`,
  margins = { top: 0, right: 0, bottom: 0, left: 0 }
}) => {
  const { selectors: { selectAssetsByIds } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  // const color = useMemo(() => {
  //   const defaultColor = 'chart.stroke'
  //   if (assets?.length === 1){
  //     return assets[0]?.color || defaultColor
  //   }
  //   return defaultColor
  // }, [assets])

  const chartData = useMemo((): BalanceChartData => {
    return data || {
      total: [],
      rainbow: []
    }
  }, [data])

  const loading = useMemo(() => {
    return !chartData.rainbow.length
  }, [chartData])

  return (
    <Box width={'full'} p={0} height={height}>
      <Graph
        color={color}
        data={chartData}
        loading={loading}
        margins={margins}
        isLoaded={!loading}
        formatFn={formatFn}
        isRainbowChart={isRainbowChart}
      />
    </Box>
  )
}

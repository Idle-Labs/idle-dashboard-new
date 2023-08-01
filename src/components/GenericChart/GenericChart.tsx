import { useMemo } from 'react'
import { abbreviateNumber } from 'helpers/'
import { Box, VStack } from '@chakra-ui/react'
import { Graph } from 'components/Graph/Graph'
import type { AssetId, HistoryTimeframe } from 'constants/types'
// import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { DownloadCsvData } from 'components/DownloadCsvData/DownloadCsvData'
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
  maxMinEnabled?: boolean
  fileName?: string | null
  timeframe?: HistoryTimeframe
  setPercentChange: (percentChange: number) => void
  margins?: { top: number; right: number; bottom: number; left: number }
}

export const GenericChart: React.FC<GenericChartArgs> = ({
  data,
  assetIds,
  fileName,
  // accountId,
  // timeframe,
  // percentChange,
  isRainbowChart,
  height = '350px',
  // setPercentChange,
  maxMinEnabled = true,
  color = 'chart.stroke',
  formatFn = (n: any) => `$${abbreviateNumber(n)}`,
  margins = { top: 0, right: 0, bottom: 0, left: 0 }
}) => {

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
    <VStack
      spacing={4}
      width={'full'}
      alignItems={'flex-end'}
    >
      {
        fileName && (
          <DownloadCsvData chartData={chartData} isRainbowChart={isRainbowChart} fileName={fileName} />
        )
      }
      <Box width={'full'} p={0} height={height}>
        <Graph
          color={color}
          data={chartData}
          loading={loading}
          margins={margins}
          assetIds={assetIds}
          isLoaded={!loading}
          formatFn={formatFn}
          maxMinEnabled={maxMinEnabled}
          isRainbowChart={isRainbowChart}
        />
      </Box>
    </VStack>
  )
}

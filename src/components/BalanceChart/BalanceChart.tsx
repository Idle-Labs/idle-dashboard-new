import { bnOrZero } from 'helpers/'
import { Graph } from 'components/Graph/Graph'
import { Box, TextProps } from '@chakra-ui/react'
import { Amount } from 'components/Amount/Amount'
import { ProviderProps } from 'contexts/common/types'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { createContext, useContext, useEffect } from 'react'
import { abbreviateNumber, calculatePercentChange } from 'helpers/'
import type { AssetId, HistoryTimeframe, HistoryData } from 'constants/types'
import { UseBalanceChartDataReturn, useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'

type BalanceChartProviderArgs = {
  accountId?: string
  assetIds: AssetId[]
  strategies?: string[]
  allowFlatChart?: boolean
  timeframe: HistoryTimeframe
} & ProviderProps

type BalanceChartArgs = {
  color?: string
  height?: string
  formatFn?: Function
  percentChange: number
  maxMinEnabled?: boolean
  isRainbowChart: boolean
  loadingEnabled?: boolean
  gradientEnabled?: boolean
  setPercentChange: (percentChange: number) => void
  margins?: { top: number; right: number; bottom: number; left: number }
}

type ContextProps = UseBalanceChartDataReturn

const BalanceChartContext = createContext<ContextProps>({
  assets: [],
  balanceChartData: {
    total: [],
    rainbow: [],
  },
  balanceChartDataLoading: false
})
export const useBalanceChartProvider = () => useContext(BalanceChartContext)
export function BalanceChartProvider({
  children,
  assetIds,
  accountId,
  timeframe,
  strategies,
  allowFlatChart = true
}: BalanceChartProviderArgs) {
  const balanceChartDataReturn = useBalanceChartData({
    assetIds,
    accountId,
    timeframe,
    strategies,
    allowFlatChart
  })

  return (
    <BalanceChartContext.Provider value={balanceChartDataReturn}>
      {children}
    </BalanceChartContext.Provider>
  )
}

const BalanceChangeUsd: React.FC<TextProps> = (props) => {
  const { balanceChartData } = useBalanceChartProvider()

  const firstValue = bnOrZero(balanceChartData.total[0].value)
  const lastValue = bnOrZero(([...balanceChartData.total].pop() as HistoryData).value)
  const valueDiff = lastValue.minus(firstValue)
  const color = valueDiff.lt(0) ? 'loss' : 'gain'
  const prefix = valueDiff.gt(0) ? '+' : ''

  return (
    <Amount.Usd prefix={prefix} value={valueDiff} color={color} {...props} />
  )
}

const BalanceChangePercentage: React.FC<TextProps> = (props) => {
  const { theme } = useThemeProvider()
  const { balanceChartData } = useBalanceChartProvider()

  const firstValue = bnOrZero(balanceChartData.total[0].value)
  const lastValue = bnOrZero(([...balanceChartData.total].pop() as HistoryData).value)
  const valueDiff = firstValue.gt(0) ? lastValue.div(firstValue).minus(1).times(100) : bnOrZero(0)
  const color = valueDiff.lt(0) ? 'loss' : 'gain'
  const prefix = valueDiff.gt(0) ? '+' : ''

  return (
    <Box
      py={'3px'}
      px={2}
      bgColor={`${theme.colors[color]}20`}
    >
      <Amount.Percentage prefix={prefix} value={valueDiff} color={color} {...props} />
    </Box>
  )
}

export const BalanceChart: React.FC<BalanceChartArgs> = ({
  formatFn,
  isRainbowChart,
  height = '350px',
  setPercentChange,
  maxMinEnabled = true,
  loadingEnabled = true,
  color = 'chart.stroke',
  gradientEnabled = true,
  margins = { top: 0, right: 0, bottom: 0, left: 0 }
}) => {
  const { balanceChartData, balanceChartDataLoading } = useBalanceChartProvider()
  const { total } = balanceChartData

  useEffect(() => setPercentChange(calculatePercentChange(total)), [total, setPercentChange])

  // const color = useMemo(() => {
  //   const defaultColor = 'chart.stroke'
  //   if (assets?.length === 1){
  //     return assets[0]?.color || defaultColor
  //   }
  //   return defaultColor
  // }, [assets])

  if (!formatFn){
    formatFn = (n: any) => `$${abbreviateNumber(n)}`
  }

  return (
    <Box width={'full'} p={0} height={height}>
      <Graph
        color={color}
        margins={margins}
        formatFn={formatFn}
        data={balanceChartData}
        maxMinEnabled={maxMinEnabled}
        isRainbowChart={isRainbowChart}
        gradientEnabled={gradientEnabled}
        isLoaded={!balanceChartDataLoading}
        loading={balanceChartDataLoading && loadingEnabled}
      />
    </Box>
  )
}

BalanceChartProvider.BalanceChart = BalanceChart
BalanceChartProvider.BalanceChangeUsd = BalanceChangeUsd
BalanceChartProvider.BalanceChangePercentage = BalanceChangePercentage
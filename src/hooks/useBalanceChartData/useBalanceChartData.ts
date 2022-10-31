import { useState, useMemo } from 'react'
import { balanceChartDataMock } from './balanceChartData.mock'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, Asset } from 'constants/types'

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type BalanceChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

type UseBalanceChartDataReturn = {
  assets?: Asset[]
  balanceChartData: BalanceChartData
  balanceChartDataLoading: boolean
}

type UseBalanceChartDataArgs = {
  assetIds: AssetId[]
  accountId?: string
  timeframe: HistoryTimeframe
}

type UseBalanceChartData = (args: UseBalanceChartDataArgs) => UseBalanceChartDataReturn

export const useBalanceChartData: UseBalanceChartData = args => {

  const { assetIds/*, timeframe*/ } = args
  const { selectors: { selectAssetsByIds } } = usePortfolioProvider()
  const [balanceChartData, setBalanceChartData] = useState<BalanceChartData>({
    total: [],
    rainbow: [],
  })
  const [balanceChartDataLoading, setBalanceChartDataLoading] = useState<boolean>(true)


  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  setTimeout(() => {
    setBalanceChartData(balanceChartDataMock)
    setBalanceChartDataLoading(false)
  },2000)

  return {
    assets,
    balanceChartData,
    balanceChartDataLoading
  }
}
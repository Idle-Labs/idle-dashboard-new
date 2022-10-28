import { useState } from 'react'
import { balanceChartDataMock } from './balanceChartData.mock'
import { AssetId, HistoryData, HistoryTimeframe } from 'constants/types'

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

  const [balanceChartData, setBalanceChartData] = useState<BalanceChartData>({
    total: [],
    rainbow: [],
  })
  const [balanceChartDataLoading, setBalanceChartDataLoading] = useState<boolean>(true)

  setTimeout(() => {
    setBalanceChartData(balanceChartDataMock)
    setBalanceChartDataLoading(false)
  },2000)

  return {
    balanceChartData,
    balanceChartDataLoading
  }
}
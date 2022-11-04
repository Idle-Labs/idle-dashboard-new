import { getTimeframeTimestamp } from 'helpers/'
import { useState, useMemo, useEffect } from 'react'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useRateChartData } from 'hooks/useRateChartData/useRateChartData'
import { AssetId, HistoryData, HistoryTimeframe, Asset } from 'constants/types'

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type PerformanceChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

type UsePerformanceChartDataReturn = {
  assets?: Asset[]
  performanceChartData: PerformanceChartData
  performanceChartDataLoading: boolean
}

type UsePerformanceChartDataArgs = {
  assetIds: AssetId[]
  timeframe?: HistoryTimeframe
}

type UsePerformanceChartData = (args: UsePerformanceChartDataArgs) => UsePerformanceChartDataReturn

export const usePerformanceChartData: UsePerformanceChartData = args => {
  
  const [ performanceChartDataLoading, setPerformanceChartDataLoading ] = useState<boolean>(true)
  const { historicalPrices, selectors: { selectAssetsByIds, selectAssetHistoricalPrices } } = usePortfolioProvider()

  const { assetIds, timeframe } = args

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const timeframeStartTimestamp = useMemo((): number => {
    if (!timeframe) return 0
    return getTimeframeTimestamp(timeframe)
  }, [timeframe])

  const performanceChartData = useMemo((): PerformanceChartData => {

    const chartData: PerformanceChartData = {
      total: [],
      rainbow: []
    }

    if (!Object.keys(historicalPrices).length) return chartData

    const pricesByDate = assets.reduce( (pricesByDate: Record<number, RainbowData>, asset: Asset, assetIndex: number) => {
      if (!asset.id) return pricesByDate
      const prices = selectAssetHistoricalPrices(asset.id)
      if (!prices) return pricesByDate
      prices.forEach( (price: HistoryData) => {
        const date = price.date
        
        if (date<timeframeStartTimestamp) return

        const value = price.value

        if (!pricesByDate[date]) {
          pricesByDate[date] = {
            date,
            total: 0
          }
        }
        if (asset.id) {
          pricesByDate[date][asset.id] = value

          // Take the first asset to populate the total chart
          if (!assetIndex) {
            chartData.total.push({
              date,
              value
            })
          }
        }
      })
      return pricesByDate
    }, {})

    chartData.rainbow = Object.values(pricesByDate)
    return chartData
  }, [assets, historicalPrices, selectAssetHistoricalPrices, timeframeStartTimestamp])

  useEffect(() => {
    if (!performanceChartData.rainbow.length) return
    setPerformanceChartDataLoading(false)

    return () => {
      setPerformanceChartDataLoading(true)
    }
  }, [performanceChartData])

  return {
    assets,
    performanceChartData,
    performanceChartDataLoading
  }
}
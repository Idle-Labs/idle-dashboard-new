import { getTimeframeTimestamp } from 'helpers/'
import { useState, useMemo, useEffect } from 'react'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, Asset } from 'constants/types'

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type RateChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

type UseRateChartDataReturn = {
  assets?: Asset[]
  rateChartData: RateChartData
  rateChartDataLoading: boolean
}

type UseRateChartDataArgs = {
  assetIds: AssetId[]
  timeframe?: HistoryTimeframe
}

type UseRateChartData = (args: UseRateChartDataArgs) => UseRateChartDataReturn

export const useRateChartData: UseRateChartData = args => {

  const { assetIds, timeframe } = args

  const { historicalRates, selectors: { selectAssetsByIds, selectAssetHistoricalRates } } = usePortfolioProvider()
  const [rateChartDataLoading, setRateChartDataLoading] = useState<boolean>(true)

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const timeframeStartTimestamp = useMemo((): number => {
    if (!timeframe) return 0
    return getTimeframeTimestamp(timeframe)
  }, [timeframe])

  const rateChartData = useMemo((): RateChartData => {

    const chartData: RateChartData = {
      total: [],
      rainbow: []
    }

    if (!Object.keys(historicalRates).length) return chartData

    const ratesByDate = assets.reduce( (ratesByDate: Record<number, RainbowData>, asset: Asset, assetIndex: number) => {
      if (!asset.id) return ratesByDate
      const rates = selectAssetHistoricalRates(asset.id)
      if (!rates) return ratesByDate
      rates.forEach( (rate: HistoryData) => {
        const date = rate.date

        // Filter by selected timestamp
        if (date<timeframeStartTimestamp) return 

        if (!ratesByDate[date]) {
          ratesByDate[date] = {
            date,
            total: 0
          }
        }
        if (asset.id) {
          ratesByDate[date][asset.id] = rate.value

          // Take the first asset to populate the total chart
          if (!assetIndex) {
            chartData.total.push({
              date,
              value: rate.value
            })
          }
        }
      })
      return ratesByDate
    }, {})

    chartData.rainbow = Object.values(ratesByDate)
    return chartData
  }, [assets, timeframeStartTimestamp, historicalRates, selectAssetHistoricalRates])

  useEffect(() => {
    if (!rateChartData.rainbow.length) return
    setRateChartDataLoading(false)

    return () => {
      setRateChartDataLoading(true)
    }
  }, [rateChartData])

  // console.log('rateChartData', assetIds, rateChartData)

  return {
    assets,
    rateChartData,
    rateChartDataLoading
  }
}
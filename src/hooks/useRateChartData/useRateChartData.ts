import { getChartTimestampBounds } from 'helpers/'
import { useState, useMemo, useEffect } from 'react'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, DateRange, Asset } from 'constants/types'

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
  dateRange?: DateRange
  timeframe?: HistoryTimeframe
}

type UseRateChartData = (args: UseRateChartDataArgs) => UseRateChartDataReturn

export const useRateChartData: UseRateChartData = args => {

  const { assetIds, timeframe, dateRange } = args

  const [ rateChartDataLoading, setRateChartDataLoading ] = useState<boolean>(true)
  const { historicalRates, selectors: { selectAssetsByIds, selectAssetHistoricalRates, selectVaultById } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const [
    timeframeStartTimestamp,
    timeframeEndTimestamp
  ] = useMemo(() => getChartTimestampBounds(timeframe, dateRange), [timeframe, dateRange])

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
      const vault = selectVaultById(asset.id)
      rates.forEach( (rate: HistoryData) => {
        const date = rate.date
        const value = rate.value
        const assetStartTimestamp = "stats" in vault && vault.stats?.startTimestamp
        const startTimestampToUse = assetStartTimestamp && assetStartTimestamp>timeframeStartTimestamp ? assetStartTimestamp : timeframeStartTimestamp

        // Filter by selected timestamp
        if (date<startTimestampToUse || (timeframeEndTimestamp && date>timeframeEndTimestamp)) return

        if (!ratesByDate[date]) {
          ratesByDate[date] = {
            date,
            total: 0
          }
        }
        if (asset.id) {
          ratesByDate[date][asset.id] = value

          // Take the first asset to populate the total chart
          if (!assetIndex) {
            chartData.total.push({
              date,
              value
            })
          }
        }
      })
      return ratesByDate
    }, {})

    chartData.rainbow = Object.values(ratesByDate)
    return chartData
  }, [assets, timeframeStartTimestamp, timeframeEndTimestamp, historicalRates, selectVaultById, selectAssetHistoricalRates])

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
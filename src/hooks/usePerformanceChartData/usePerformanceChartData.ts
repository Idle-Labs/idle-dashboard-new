import { SECONDS_IN_YEAR } from 'constants/'
import { useState, useMemo, useEffect } from 'react'
import { BNify, getChartTimestampBounds } from 'helpers/'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, DateRange, Asset } from 'constants/types'

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
  useRates?: boolean
  dateRange?: DateRange
  timeframe?: HistoryTimeframe
}

type UsePerformanceChartData = (args: UsePerformanceChartDataArgs) => UsePerformanceChartDataReturn

export const usePerformanceChartData: UsePerformanceChartData = args => {    

  const [ performanceChartDataLoading, setPerformanceChartDataLoading ] = useState<boolean>(true)
  const { historicalRates, historicalPrices, selectors: { selectAssetsByIds, selectVaultById, selectAssetHistoricalPrices, selectAssetHistoricalRates } } = usePortfolioProvider()

  const { useRates = false, assetIds, timeframe, dateRange } = args

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const [
    timeframeStartTimestamp,
    timeframeEndTimestamp
  ] = useMemo(() => getChartTimestampBounds(timeframe, dateRange), [timeframe, dateRange])

  const performanceChartData = useMemo((): PerformanceChartData => {

    const chartData: PerformanceChartData = {
      total: [],
      rainbow: []
    }

    if (useRates){
      if (!Object.keys(historicalRates).length) return chartData
      const pricesByDate = assets.reduce( (pricesByDate: Record<number, RainbowData>, asset: Asset, assetIndex: number) => {
        if (!asset.id) return pricesByDate
        const rates = selectAssetHistoricalRates(asset.id)
        if (!rates) return pricesByDate
        const vault = selectVaultById(asset.id)

        let price = BNify(1)
        let prevRate: HistoryData | null = null
        rates.forEach( (d: HistoryData) => {
          const date = d.date
          const rate = d.value
          const assetStartTimestamp = ("stats" in vault) && vault.stats?.startTimestamp
          const startTimestampToUse = assetStartTimestamp && assetStartTimestamp>timeframeStartTimestamp ? assetStartTimestamp : timeframeStartTimestamp
          
          if (date<startTimestampToUse || (timeframeEndTimestamp && date>timeframeEndTimestamp)) return

          if (prevRate && BNify(rate).lt(9999)){
            const secondsDiff = Math.round((date-prevRate.date)/1000)
            const annualGain = BNify(rate).div(100)
            const realGain = annualGain.times(secondsDiff).div(SECONDS_IN_YEAR)
            price = price.plus(price.times(realGain))
          }

          const value = price.toNumber()
          
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

          prevRate = d
        })
        return pricesByDate
      }, {})

      chartData.rainbow = Object.values(pricesByDate)
    } else {
      if (!Object.keys(historicalPrices).length) return chartData
      const pricesByDate = assets.reduce( (pricesByDate: Record<number, RainbowData>, asset: Asset, assetIndex: number) => {
        if (!asset.id) return pricesByDate
        const prices = selectAssetHistoricalPrices(asset.id)
        if (!prices) return pricesByDate
        const vault = selectVaultById(asset.id)
        prices.forEach( (price: HistoryData) => {
          const date = price.date
          const assetStartTimestamp = "stats" in vault && vault.stats?.startTimestamp
          const startTimestampToUse = assetStartTimestamp && assetStartTimestamp>timeframeStartTimestamp ? assetStartTimestamp : timeframeStartTimestamp
          
          if (date<startTimestampToUse || (timeframeEndTimestamp && date>timeframeEndTimestamp)) return

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
    }

    return chartData
  }, [assets, historicalPrices, selectAssetHistoricalPrices, selectAssetHistoricalRates, historicalRates, useRates, selectVaultById, timeframeStartTimestamp, timeframeEndTimestamp])

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
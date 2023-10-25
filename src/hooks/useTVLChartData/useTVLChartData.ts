import { getChartTimestampBounds } from 'helpers/'
import { useState, useMemo, useEffect } from 'react'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, DateRange, Asset } from 'constants/types'

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type TVLChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

type UseTVLChartDataReturn = {
  assets?: Asset[]
  tvlChartData: TVLChartData
  tvlChartDataLoading: boolean
}

type UseTVLChartDataArgs = {
  assetIds: AssetId[]
  dateRange?: DateRange
  timeframe?: HistoryTimeframe
  useDollarConversion?: boolean
}

type UseTVLChartData = (args: UseTVLChartDataArgs) => UseTVLChartDataReturn

export const useTVLChartData: UseTVLChartData = ({
  assetIds,
  dateRange,
  timeframe,
  useDollarConversion = true
}) => {
  
  const [ tvlChartDataLoading, setTVLChartDataLoading ] = useState<boolean>(true)
  const { historicalTvls, selectors: { selectAssetsByIds, selectVaultById, selectAssetHistoricalTvls, selectAssetHistoricalTvlsUsd } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const [
    timeframeStartTimestamp,
    timeframeEndTimestamp
  ] = useMemo(() => getChartTimestampBounds(timeframe, dateRange), [timeframe, dateRange])

  const tvlChartData = useMemo((): TVLChartData => {

    const chartData: TVLChartData = {
      total: [],
      rainbow: []
    }

    if (!Object.keys(historicalTvls).length) return chartData

    const pricesByDate = assets.reduce( (pricesByDate: Record<number, RainbowData>, asset: Asset, assetIndex: number) => {
      if (!asset.id) return pricesByDate
      const prices = useDollarConversion ? selectAssetHistoricalTvlsUsd(asset.id) : selectAssetHistoricalTvls(asset.id)
      if (!prices) return pricesByDate
      const vault = selectVaultById(asset.id)

      prices.forEach( (price: HistoryData) => {
        const date = price.date
        
        const assetStartTimestamp = ("stats" in vault) && vault.stats?.startTimestamp
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
    return chartData
  }, [assets, useDollarConversion, selectVaultById, historicalTvls, selectAssetHistoricalTvls, selectAssetHistoricalTvlsUsd, timeframeStartTimestamp, timeframeEndTimestamp])

  useEffect(() => {
    if (!tvlChartData.rainbow.length) return
    setTVLChartDataLoading(false)

    return () => {
      setTVLChartDataLoading(true)
    }
  }, [tvlChartData])

  return {
    assets,
    tvlChartData,
    tvlChartDataLoading
  }
}
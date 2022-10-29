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
  timeframe: HistoryTimeframe
}

type UseRateChartData = (args: UseRateChartDataArgs) => UseRateChartDataReturn

export const useRateChartData: UseRateChartData = args => {

  const { assetIds/*, timeframe*/ } = args

  const { rates, selectors: { selectAssetsByIds } } = usePortfolioProvider()
  // const [rateChartData, setRateChartData] = useState<RateChartData>({
  //   total: [],
  //   rainbow: [],
  // })
  const [rateChartDataLoading, setRateChartDataLoading] = useState<boolean>(true)

  const assets = selectAssetsByIds(assetIds)

  const rateChartData = useMemo((): RateChartData => {

    const rateChartData = {
      total: [],
      rainbow: []
    }

    if (!Object.keys(rates).length) return rateChartData

    const ratesByDate = assets.reduce( (ratesByDate: Record<number, RainbowData>, asset: Asset) => {
      if (!asset.id || !asset.rates) return ratesByDate
      asset.rates.forEach( (rate: HistoryData) => {
        const date = rate.date
        if (!ratesByDate[date]) {
          ratesByDate[date] = {
            date,
            total: 0
          }
        }
        if (asset.id) {
          ratesByDate[date][asset.id] = rate.value
        }
      })
      return ratesByDate
    }, {})

    rateChartData.total = assets[0]?.rates
    rateChartData.rainbow = Object.values(ratesByDate)
    return rateChartData
  }, [assets, rates])

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
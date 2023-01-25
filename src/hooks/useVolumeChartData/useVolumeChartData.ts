import { strategies } from 'constants/'
import { useState, useMemo, useEffect } from 'react'
import { BNify, getTimeframeTimestamp } from 'helpers/'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, RainbowData, HistoryTimeframe, Asset } from 'constants/types'
import { HistogramChartLabels, HistogramChartColors } from 'components/HistogramChart/HistogramChart'

export type VolumeChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

type ExtraData = {
  labels: HistogramChartLabels
  colors: HistogramChartColors
}

type UseVolumeChartDataReturn = {
  volumeChartData: VolumeChartData
  volumeChartDataLoading: boolean
} & ExtraData

type UseVolumeChartDataArgs = {
  assetIds: AssetId[]
  timeframe?: HistoryTimeframe
  useDollarConversion?: boolean
}

type UseVolumeChartData = (args: UseVolumeChartDataArgs) => UseVolumeChartDataReturn

export const useVolumeChartData: UseVolumeChartData = ({
  assetIds,
  timeframe,
  useDollarConversion = true
}) => {
  
  const [ volumeChartDataLoading, setVolumeChartDataLoading ] = useState<boolean>(true)
  const { historicalTvls, selectors: { selectAssetsByIds, selectAssetHistoricalTvls, selectAssetHistoricalTvlsUsd } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const timeframeStartTimestamp = useMemo((): number => {
    if (!timeframe) return 0
    return getTimeframeTimestamp(timeframe)
  }, [timeframe])

  const volumeChartData = useMemo((): VolumeChartData => {

    const chartData: VolumeChartData = {
      total: [],
      rainbow: []
    }

    if (!Object.keys(historicalTvls).length) return chartData

    const volumeByDate = assets.reduce( (volumeByDate: Record<number, RainbowData>, asset: Asset) => {
      if (!asset.id) return volumeByDate
      const tvls = useDollarConversion ? selectAssetHistoricalTvlsUsd(asset.id) : selectAssetHistoricalTvls(asset.id)
      if (!tvls) return volumeByDate
      
      let prevTvl: HistoryData | null = null
      tvls.forEach( (tvl: HistoryData) => {
        const date = tvl.date
        
        if (date<timeframeStartTimestamp) return

        if (prevTvl && asset.id) {
          if (!volumeByDate[date]) {
            volumeByDate[date] = {
              date,
              total: 0
            }
          }
          const volume = BNify(tvl.value).minus(prevTvl.value)
          volumeByDate[date][asset.id] = Number(volume.toFixed(8))
          volumeByDate[date].total = Number(BNify(volumeByDate[date].total).plus(volume).toFixed(8))
        }

        prevTvl = tvl
      })
      return volumeByDate
    }, {})

    chartData.total = (Object.values(volumeByDate) as Array<RainbowData>).map( (v: RainbowData) => ({
      date: v.date,
      value: v.total
    }))

    chartData.rainbow = Object.values(volumeByDate)

    return chartData
  }, [assets, useDollarConversion, historicalTvls, selectAssetHistoricalTvls, selectAssetHistoricalTvlsUsd, timeframeStartTimestamp])

  const extraData = useMemo((): ExtraData => {
    if (!assets.length) return {
      labels: {},
      colors: {}
    }
    return assets.reduce( (extraData: ExtraData, asset: Asset) => {
      return {
        ...extraData,
        labels: {
          ...extraData.labels,
          [asset.id as string]: asset.name
        },
        colors: {
          ...extraData.colors,
          [asset.id as string]: strategies[asset.type as string].color
        }
      }
    }, {
      labels: {},
      colors: {}
    })
  }, [assets])

  useEffect(() => {
    if (!volumeChartData.rainbow.length) return
    setVolumeChartDataLoading(false)

    return () => {
      setVolumeChartDataLoading(true)
    }
  }, [volumeChartData])

  return {
    volumeChartData,
    volumeChartDataLoading,
    labels: extraData.labels,
    colors: extraData.colors,
  }
}
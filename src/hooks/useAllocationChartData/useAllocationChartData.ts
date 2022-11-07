import { useMemo } from 'react'
import type { AssetId } from 'constants/types'
import { protocols } from 'constants/protocols'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import type { BarChartKey, BarChartData, BarChartColors, BarChartLabels } from 'components/BarChart/BarChart'

type UseAllocationChartDataArgs = {
  assetId: AssetId | undefined
}

type ExtraData = {
  labels: BarChartLabels
  colors: BarChartColors
}

type UseAllocationChartDataReturn = {
  allocations: BarChartData
} & ExtraData

type UseAllocationChartData = (args: UseAllocationChartDataArgs) => UseAllocationChartDataReturn

export const useAllocationChartData: UseAllocationChartData = ({ assetId }) => {

  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const extraData = useMemo((): ExtraData => {
    if (!asset?.allocations) return {
      labels: {},
      colors: {}
    }
    return Object.keys(asset.allocations).reduce( (extraData: ExtraData, protocoKey: BarChartKey) => {
      return {
        ...extraData,
        labels: {
          ...extraData.labels,
          [protocoKey]: protocols[protocoKey].label
        },
        colors: {
          ...extraData.colors,
          [protocoKey]: `rgb(${protocols[protocoKey]?.colors?.rgb.join(',')})`
        }
      }
    }, {
      labels: {},
      colors: {}
    })
  }, [asset?.allocations])

  return {
    labels: extraData.labels,
    colors: extraData.colors,
    allocations: asset?.allocations
  }
}